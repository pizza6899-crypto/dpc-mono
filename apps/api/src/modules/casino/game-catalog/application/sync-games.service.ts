import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { GameAggregatorType, Language, GameProvider, GameCategory } from '@repo/database';
import { SyncResultResponseDto } from '../controllers/admin/dto/response/sync-result.response.dto';
import { type GameRepositoryPort, GAME_REPOSITORY } from '../ports/game.repository.port';
import { AggregatorClientFactory } from '../../aggregator/infrastructure/aggregator.factory';
import { AggregatorGameDto, AGGREGATOR_CODE_MAP } from '../../aggregator/ports/aggregator-game.dto';
import { DcsMapperService } from '../../providers/dcs/infrastructure/dcs-mapper.service';
import { WhitecliffMapperService } from '../../providers/whitecliff/infrastructure/whitecliff-mapper.service';

@Injectable()
export class SyncGamesService {
    private readonly logger = new Logger(SyncGamesService.name);

    constructor(
        @Inject(GAME_REPOSITORY)
        private readonly gameRepository: GameRepositoryPort,
        private readonly aggregatorClientFactory: AggregatorClientFactory,
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async execute(): Promise<SyncResultResponseDto> {
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
                await this.syncAggregator(type, result);
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
        stats: SyncResultResponseDto
    ) {
        this.logger.log(`Starting sync for ${type}...`);

        try {
            const client = this.aggregatorClientFactory.getClient(type);
            const games = await client.fetchGameList();

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

            for (const gameDto of games) {
                try {
                    const created = await this.upsertGame(type, aggregator.id, gameDto);
                    if (created) {
                        stats.created++;
                    } else {
                        // stats.skipped++; // 필요한 경우 skipped 통계 추가
                    }
                } catch (e) {
                    this.logger.error(`Failed to sync game ${gameDto.gameCode}: ${e.message}`);
                    stats.failed++;
                }
            }

        } catch (e) {
            this.logger.error(`Error syncing aggregator ${type}: ${e.message}`);
            // Don't stop other aggregators
        }
    }

    private async upsertGame(aggregatorType: GameAggregatorType, aggregatorId: bigint, gameDto: AggregatorGameDto): Promise<boolean> {
        // 1. Find Provider
        // 우선 매핑된 코드로 DB에서 Provider 검색
        let providerCodeEnum: GameProvider | undefined;

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

        let provider = providerCodeEnum ? await this.tx.casinoGameProvider.findFirst({
            where: {
                aggregatorId,
                // code는 String 컬럼이지만 Enum 값을 저장/조회
                code: providerCodeEnum.toString(),
            },
        }) : null;

        // 매핑된 코드로 못 찾았거나 매핑이 없으면 이름으로 백업 검색
        if (!provider) {
            provider = await this.tx.casinoGameProvider.findFirst({
                where: {
                    aggregatorId,
                    name: gameDto.providerName,
                },
            });
        }

        if (!provider) {
            // Provider가 없으면 스킵
            return false;
        }

        // 2. Map Category & Find Category Entity
        let categoryCode = 'SLOTS'; // Default Category Code

        if (gameDto.category) {
            let mappedCategory: GameCategory | undefined;
            if (aggregatorType === GameAggregatorType.WHITECLIFF) {
                mappedCategory = WhitecliffMapperService.CATEGORY_MAP[gameDto.category];
            } else if (aggregatorType === GameAggregatorType.DC) {
                mappedCategory = DcsMapperService.CATEGORY_MAP[gameDto.category];
            }

            if (mappedCategory) {
                categoryCode = mappedCategory;
            }
        }

        const categoryEntity = await this.tx.casinoGameCategory.findUnique({
            where: { code: categoryCode }
        });

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
            // 이미 존재하면 업데이트 하지 않음 (관리자 관리 영역)
            return false;
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
                isEnabled: gameDto.isEnabled ?? false, // 기본값 false
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

        return true;
    }

    private generateGameCode(providerName: string, gameName: string): string {
        const p = providerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const g = gameName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `${p}_${g}`;
    }
}
