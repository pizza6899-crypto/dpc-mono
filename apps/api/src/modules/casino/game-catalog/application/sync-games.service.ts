import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { GameAggregatorType, Language } from '@repo/database';
import { SyncResultResponseDto } from '../controllers/admin/dto/response/sync-result.response.dto';
import { type GameRepositoryPort, GAME_REPOSITORY } from '../ports/game.repository.port';
import { AggregatorClientFactory } from '../../aggregator/infrastructure/aggregator.factory';
import { AggregatorGameDto } from '../../aggregator/ports/aggregator-game.dto';

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
                // GameAggregatorType.DCS, // Add when ready
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
            const aggregatorCode = type === GameAggregatorType.WHITECLIFF ? 'WC' : 'DCS';

            const aggregator = await this.tx.casinoAggregator.findUnique({
                where: { code: aggregatorCode }
            });

            if (!aggregator) {
                this.logger.error(`Aggregator not found in DB for type ${type} (code: ${aggregatorCode})`);
                return;
            }

            for (const gameDto of games) {
                try {
                    await this.upsertGame(aggregator.id, gameDto);
                    stats.updated++;
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

    private async upsertGame(aggregatorId: bigint, gameDto: AggregatorGameDto) {
        // 1. Find Provider by Name/Code
        // We use providerName from DTO as identifying code for now.
        // Ideally DTO should have providerCode from adapter.

        const providerName = gameDto.providerName;

        const provider = await this.tx.casinoGameProvider.findFirst({
            where: {
                aggregatorId: aggregatorId,
                name: providerName,
            }
        });

        if (!provider) {
            // Provider must exist. Skipping if not found.
            // In real world, we might auto-create provider here too.
            // this.logger.warn(`Provider ${gameDto.providerName} not found. Skipping game ${gameDto.gameName}`);
            return;
        }

        const externalGameId = gameDto.gameCode;

        // 2. Find existing game
        const existingGame = await this.tx.casinoGameV2.findUnique({
            where: {
                providerId_externalGameId: {
                    providerId: provider.id,
                    externalGameId
                }
            }
        });

        const code = this.generateGameCode(gameDto.providerName, gameDto.gameName);

        if (existingGame) {
            // Update
            await this.tx.casinoGameV2.update({
                where: { id: existingGame.id },
                data: {
                    thumbnailUrl: gameDto.thumbnailUrl,
                    updatedAt: new Date(),
                }
            });
        } else {
            // Create
            await this.tx.casinoGameV2.create({
                data: {
                    providerId: provider.id,
                    externalGameId,
                    code,
                    thumbnailUrl: gameDto.thumbnailUrl,
                    gameType: gameDto.gameType,
                    tableId: gameDto.tableId,
                    isEnabled: false,
                    isVisible: false,
                    translations: {
                        create: {
                            language: Language.EN, // Default EN translation
                            name: gameDto.gameName
                        }
                    }
                }
            });
            // TODO: Update 'created' stat properly
        }
    }

    private generateGameCode(providerName: string, gameName: string): string {
        const p = providerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const g = gameName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `${p}_${g}`;
    }
}
