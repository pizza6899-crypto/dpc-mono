import { Injectable } from '@nestjs/common';
import { CasinoGameTransaction as PrismaGameTransaction } from '@prisma/client';
import { GameTransaction } from '../domain/model/game-transaction.entity';

@Injectable()
export class GameTransactionMapper {
    toDomain(prismaModel: PrismaGameTransaction): GameTransaction {
        return GameTransaction.fromPersistence(prismaModel);
    }

    toPrisma(domain: GameTransaction): any {
        return {
            id: domain.id,
            gameRoundId: domain.gameRoundId,
            roundStartedAt: domain.roundStartedAt,
            userId: domain.userId,
            type: domain.type,
            aggregatorTxId: domain.aggregatorTxId,
            amount: domain.amount,
            gameAmount: domain.gameAmount,
            balanceType: domain.balanceType,
            currency: domain.currency,
            createdAt: domain.createdAt,
        };
    }
}
