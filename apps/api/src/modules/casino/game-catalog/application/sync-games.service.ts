import { Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CasinoGameV2, Language } from '@repo/database';
import { WhitecliffApiService } from '../../whitecliff/infrastructure/whitecliff-api.service';
import { SyncResultResponseDto } from '../controllers/admin/dto/response/sync-result.response.dto';
import { type GameRepositoryPort, GAME_REPOSITORY } from '../ports/game.repository.port';
import { Inject } from '@nestjs/common';

@Injectable()
export class SyncGamesService {
    private readonly logger = new Logger(SyncGamesService.name);

    constructor(
        // @InjectTransaction()
        // private readonly tx: PrismaTransaction,
        @Inject(GAME_REPOSITORY)
        private readonly gameRepository: GameRepositoryPort,
        private readonly whitecliffApiService: WhitecliffApiService,
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async execute(): Promise<SyncResultResponseDto> {
        const startTime = Date.now();

        let result: SyncResultResponseDto = {
            total: 0,
            created: 0,
            updated: 0,
            failed: 0,
            executionTime: 0,
        };

        try {
            // Whitecliff
            result = await this.syncWhitecliffGames(result);

            // Future: DCS, etc.
            // result = await this.syncDcsGames(result);

        } catch (error) {
            this.logger.error(`Sync failed: ${error.message}`, error.stack);
            throw error;
        } finally {
            result.executionTime = Date.now() - startTime;
        }

        return result;
    }

    private async syncWhitecliffGames(
        stats: SyncResultResponseDto
    ): Promise<SyncResultResponseDto> {
        // 1. Fetch data from Whitecliff API (KRW 기준)
        const response = await this.whitecliffApiService.getProductGameList({
            gameCurrency: 'KRW',
            language: Language.EN, // 영문 이름 기준
        });

        if ('error' in response) {
            throw new Error(`Whitecliff API Error: ${response.error}`);
        }

        const gameList = response.game_list;
        const totalItems = Object.values(gameList).flat().length;
        stats.total = totalItems;

        // 2. Process each game
        // providerId (key) -> games[]
        for (const [providerIdStr, games] of Object.entries(gameList)) {
            const externalProviderId = providerIdStr;

            // Find or Create Provider (Simplification needed: Provider sync service might be separate)
            // For now, assume Providers must exist or we map them.
            // In a real scenario, we should sync providers first or look them up.
            // Let's defer strict provider check for now and focus on game upsert logic structure.

            // To make this robust, we need to find the internal provider ID by externalId + aggregator.
            // Since we don't have provider repository injected yet, we will use raw Prisma or need to add it.
            // Using raw TX for provider lookup to keep it simple.

            const provider = await this.tx.casinoGameProvider.findUnique({
                where: {
                    aggregatorId_externalId: {
                        aggregatorId: BigInt(1), // Hardcoded Whitecliff ID for now, should be dynamic
                        externalId: externalProviderId,
                    }
                }
            });

            if (!provider) {
                this.logger.warn(`Provider not found for externalId: ${externalProviderId}. Skipping games.`);
                // stats.failed += games.length;
                // In production, we might want to auto-create provider or skip.
                // Let's create a placeholder provider if not exists? No, better warn and skip.

                // For MVP, if provider doesn't exist, we can't link games.
                // You might need a SyncProviderService first.
                continue;
            }

            for (const gameData of games) {
                try {
                    await this.upsertGame(provider.id, gameData);
                    stats.updated++; // Simplifying logic (created/updated distinction requires more checks)
                } catch (e) {
                    this.logger.error(`Failed to sync game ${gameData.game_id}: ${e.message}`);
                    stats.failed++;
                }
            }
        }

        return stats;
    }

    private async upsertGame(providerId: bigint, gameData: any) {
        // Logic to upsert CasinoGameV2
        // We need to map Whitecliff fields to our Schema

        const externalGameId = gameData.game_id.toString();

        // 1. Find existing game
        const existingGame = await this.tx.casinoGameV2.findUnique({
            where: {
                providerId_externalGameId: {
                    providerId,
                    externalGameId
                }
            }
        });

        const code = this.generateGameCode(gameData.prd_name, gameData.game_name);

        if (existingGame) {
            // Update
            await this.tx.casinoGameV2.update({
                where: { id: existingGame.id },
                data: {
                    thumbnailUrl: gameData.game_icon_link,
                    // Update other fields if necessary
                    updatedAt: new Date(),
                }
            });
            // Update Translation if needed
        } else {
            // Create
            await this.tx.casinoGameV2.create({
                data: {
                    providerId,
                    externalGameId,
                    code,
                    thumbnailUrl: gameData.game_icon_link,
                    gameType: gameData.game_type,
                    tableId: gameData.table_id,
                    isEnabled: false, // Default disabled for safety
                    isVisible: false,
                    translations: {
                        create: {
                            language: Language.EN,
                            name: gameData.game_name
                        }
                    }
                }
            });
        }
    }

    private generateGameCode(providerName: string, gameName: string): string {
        // Simple slugify
        const p = providerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const g = gameName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `${p}_${g}`;
    }
}
