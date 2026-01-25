import { Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { GameAggregatorType, Language, GameProvider } from '@prisma/client';
import { SyncResultResponseDto } from '../controllers/admin/dto/response/sync-result.response.dto';

import { AggregatorClientFactory } from '../../aggregator/infrastructure/aggregator.factory';
import { AggregatorGameDto, AGGREGATOR_CODE_MAP } from '../../aggregator/ports/aggregator-game.dto';
import { DcsMapperService } from '../../providers/dcs/infrastructure/dcs-mapper.service';
import { WhitecliffMapperService } from '../../providers/whitecliff/infrastructure/whitecliff-mapper.service';

@Injectable()
export class SyncGamesService {
    private readonly logger = new Logger(SyncGamesService.name);

    constructor(
        private readonly aggregatorClientFactory: AggregatorClientFactory,
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async execute(useMock: boolean = true): Promise<SyncResultResponseDto> {
        const startTime = Date.now();

        const result: SyncResultResponseDto = {
            total: 0,
            created: 0,
            updated: 0,
            failed: 0,
            executionTime: 0,
        };

        try {
            // Supported aggregators to sync
            const aggregatorsToSync = [
                GameAggregatorType.WHITECLIFF,
                GameAggregatorType.DC,
            ];

            for (const type of aggregatorsToSync) {
                await this.syncAggregator(type, result, useMock);
            }

        } catch (error) {
            this.logger.error(`Sync failed: ${error.message}`, error.stack);
            throw error;
        } finally {
            result.executionTime = Date.now() - startTime;
        }

        return result;
    }

    private async syncAggregator(
        type: GameAggregatorType,
        stats: SyncResultResponseDto,
        useMock: boolean
    ) {
        this.logger.log(`Starting sync for ${type}...`);

        try {
            const client = this.aggregatorClientFactory.getClient(type);
            const games = await client.fetchGameList(useMock);

            stats.total += games.length;

            // Get aggregator ID from DB
            const aggregatorCode = AGGREGATOR_CODE_MAP[type];

            const aggregator = await this.tx.casinoAggregator.findUnique({
                where: { code: aggregatorCode }
            });

            if (!aggregator) {
                this.logger.error(`Aggregator not found in DB for type ${type} (code: ${aggregatorCode})`);
                return;
            }

            // Collect fetched game codes for stale check
            const fetchedGameCodes = new Set<string>();

            for (const gameDto of games) {
                fetchedGameCodes.add(gameDto.gameCode); // Set에 추가

                try {
                    const status = await this.upsertGame(type, aggregator.id, gameDto);
                    if (status === 'created') stats.created++;
                    else if (status === 'updated') stats.updated++;
                } catch (e) {
                    this.logger.error(`Failed to sync game ${gameDto.gameCode}: ${e.message}`);
                    stats.failed++;
                }
            }

            // [안전 장치] 가져온 게임 목록이 비어있지 않을 때만 누락된 게임 처리 수행
            // (API 오류로 빈 리스트가 올 경우 전체 비활성화를 방지하기 위함)
            if (games.length > 0) {
                await this.deactivateMissingGames(aggregator.id, fetchedGameCodes, stats);
            } else {
                this.logger.warn(`No games fetched for ${type}. Skipping deactivation logic to prevent accidental wipeout.`);
            }

        } catch (e) {
            this.logger.error(`Error syncing aggregator ${type}: ${e.message}`);
            // Don't stop other aggregators
        }
    }

    /**
     * 목록에 없는 게임 비활성화 (Stale Games Handling)
     * API에서 받아온 목록에 존재하지 않는 DB상의 활성 게임을 비활성화합니다.
     */
    private async deactivateMissingGames(
        aggregatorId: bigint,
        fetchedGameCodes: Set<string>,
        stats: SyncResultResponseDto
    ) {
        // 1. DB에서 해당 Aggregator의 '활성화된' 게임들을 모두 조회
        const activeGamesInDb = await this.tx.casinoGameV2.findMany({
            where: {
                provider: { aggregatorId },
                isEnabled: true,
            },
            select: { id: true, externalGameId: true, code: true }
        });

        // 2. API 목록에 없는 게임 식별
        const gamesToDeactivate = activeGamesInDb.filter(
            dbGame => !fetchedGameCodes.has(dbGame.externalGameId)
        );

        if (gamesToDeactivate.length === 0) {
            return;
        }

        this.logger.warn(`Found ${gamesToDeactivate.length} games that are no longer in the aggregator list. Deactivating...`);

        // 3. 비활성화 처리
        const idsToDeactivate = gamesToDeactivate.map(g => g.id);

        // 상세 로그 (어떤 게임이 꺼지는지)
        if (gamesToDeactivate.length <= 10) {
            this.logger.log(`Deactivating games: ${gamesToDeactivate.map(g => `${g.code}(${g.externalGameId})`).join(', ')}`);
        }

        await this.tx.casinoGameV2.updateMany({
            where: { id: { in: idsToDeactivate } },
            data: {
                isEnabled: false,
                isVisible: false // 안전을 위해 노출도 끔
            }
        });

        // 통계에 반영 (업데이트된 것으로 간주)
        stats.updated += gamesToDeactivate.length;
    }

    private async upsertGame(aggregatorType: GameAggregatorType, aggregatorId: bigint, gameDto: AggregatorGameDto): Promise<'created' | 'updated' | 'skipped'> {
        // 1. Resolve Provider (매핑 및 DB 조회)
        const provider = await this.resolveProvider(aggregatorType, aggregatorId, gameDto);
        if (!provider) {
            return 'skipped';
        }

        // 2. Resolve Category
        const categoryEntity = await this.resolveCategory(aggregatorType, gameDto);

        const externalGameId = gameDto.gameCode;

        // 3. Check Existing Game
        const existingGame = await this.tx.casinoGameV2.findUnique({
            where: {
                providerId_externalGameId: {
                    providerId: provider.id,
                    externalGameId
                }
            }
        });

        if (existingGame) {
            // 이미 존재하면 필요한 필드만 업데이트 (이름, 아이콘, 활성여부 등)
            const needsUpdate =
                existingGame.thumbnailUrl !== gameDto.iconUrl ||
                existingGame.gameType !== (gameDto.gameType ?? null) ||
                existingGame.tableId !== (gameDto.tableId ?? null) ||
                existingGame.isEnabled !== gameDto.isEnabled; // 상태 동기화 (재활성화 포함)

            if (needsUpdate) {
                await this.tx.casinoGameV2.update({
                    where: { id: existingGame.id },
                    data: {
                        thumbnailUrl: gameDto.iconUrl,
                        gameType: gameDto.gameType,
                        tableId: gameDto.tableId,
                        isEnabled: gameDto.isEnabled,
                    },
                });
                return 'updated';
            }

            return 'skipped';
        }

        // 4. Create New Game
        const code = this.generateGameCode(gameDto.providerName, gameDto.gameName);

        await this.tx.casinoGameV2.create({
            data: {
                providerId: provider.id,
                externalGameId,
                code,
                thumbnailUrl: gameDto.iconUrl,
                gameType: gameDto.gameType,
                tableId: gameDto.tableId,
                isEnabled: gameDto.isEnabled, // 필수 값으로 변경됨
                isVisible: false,
                translations: {
                    create: {
                        language: Language.EN, // Default EN translation
                        name: gameDto.gameName
                    }
                },
                // 기본 카테고리 연결
                categoryItems: categoryEntity ? {
                    create: {
                        categoryId: categoryEntity.id,
                        isPrimary: true,
                        sortOrder: 0
                    }
                } : undefined
            }
        });

        return 'created';
    }

    /**
     * Aggregator별 Provider 매핑 및 조회
     */
    private async resolveProvider(aggregatorType: GameAggregatorType, aggregatorId: bigint, gameDto: AggregatorGameDto) {
        let providerCodeEnum: GameProvider | undefined;

        // 1. DTO 코드를 내부 Enum으로 변환
        if (gameDto.providerCode) {
            if (aggregatorType === GameAggregatorType.WHITECLIFF) {
                const id = parseInt(gameDto.providerCode, 10);
                if (!isNaN(id)) {
                    providerCodeEnum = WhitecliffMapperService.PROVIDER_MAP[id];
                }
            } else if (aggregatorType === GameAggregatorType.DC) {
                providerCodeEnum = DcsMapperService.PROVIDER_MAP[gameDto.providerCode];
            }
        }

        // 2. Enum으로 DB 조회
        let provider = providerCodeEnum ? await this.tx.casinoGameProvider.findFirst({
            where: {
                aggregatorId,
                code: providerCodeEnum.toString(),
            },
        }) : null;

        // 3. 실패 시 이름으로 백업 검색
        if (!provider) {
            provider = await this.tx.casinoGameProvider.findFirst({
                where: {
                    aggregatorId,
                    name: gameDto.providerName,
                },
            });
        }

        return provider;
    }

    /**
     * Aggregator별 Category 매핑 및 조회
     */
    private async resolveCategory(aggregatorType: GameAggregatorType, gameDto: AggregatorGameDto) {
        let categoryCode = 'SLOTS'; // Default Category Code

        if (gameDto.category) {
            let mappedCategory: string | undefined;
            if (aggregatorType === GameAggregatorType.WHITECLIFF) {
                mappedCategory = WhitecliffMapperService.CATEGORY_MAP[gameDto.category];
            } else if (aggregatorType === GameAggregatorType.DC) {
                mappedCategory = DcsMapperService.CATEGORY_MAP[gameDto.category];
            }

            if (mappedCategory) {
                categoryCode = mappedCategory;
            }
        }

        return this.tx.casinoGameCategory.findUnique({
            where: { code: categoryCode }
        });
    }

    private generateGameCode(providerName: string, gameName: string): string {
        const p = providerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const g = gameName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `${p}_${g}`;
    }
}
