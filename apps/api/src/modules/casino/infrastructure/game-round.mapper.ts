import { Injectable } from '@nestjs/common';
import { GameRoundV2 as PrismaGameRound } from '@prisma/client';
import { GameRound } from '../domain/model/game-round.entity';

@Injectable()
export class GameRoundMapper {
    toDomain(prismaModel: PrismaGameRound): GameRound {
        return GameRound.fromPersistence(prismaModel);
    }

    toPrisma(domain: GameRound): any {
        return {
            id: domain.id,
            userId: domain.userId,
            gameSessionId: domain.gameSessionId,
            gameId: domain.gameId,
            provider: domain.provider,
            aggregatorType: domain.aggregatorType,
            aggregatorRoundId: domain.aggregatorRoundId,
            currency: domain.currency,
            gameCurrency: domain.gameCurrency,
            exchangeRate: domain.exchangeRate,
            totalBetAmount: domain.totalBetAmount,
            totalWinAmount: domain.totalWinAmount,
            totalGameBetAmount: domain.totalGameBetAmount,
            totalGameWinAmount: domain.totalGameWinAmount,
            startedAt: domain.startedAt,
            completedAt: domain.completedAt,
            isCompleted: domain.isCompleted,
        };
    }
}
