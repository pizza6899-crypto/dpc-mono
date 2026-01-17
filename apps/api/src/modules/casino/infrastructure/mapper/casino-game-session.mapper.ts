import { Injectable } from '@nestjs/common';
import { CasinoGameSession as PrismaModel } from 'src/generated/prisma';
import { CasinoGameSession } from '../../domain/model/casino-game-session.entity';

@Injectable()
export class CasinoGameSessionMapper {
    toDomain(model: PrismaModel): CasinoGameSession {
        return CasinoGameSession.create({
            id: model.id,
            uid: model.uid,
            userId: model.userId,
            playerName: model.playerName,
            token: model.token,
            aggregatorType: model.aggregatorType,
            walletCurrency: model.walletCurrency,
            gameCurrency: model.gameCurrency,
            exchangeRate: model.exchangeRate,
            exchangeRateSnapshotAt: model.exchangeRateSnapshotAt,
            usdExchangeRate: model.usdExchangeRate,
            compRate: model.compRate,
            casinoGameId: model.casinoGameId,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            lastAccessedAt: model.lastAccessedAt,
        });
    }

    // DB 저장을 위한 데이터 변환 (Create 시 주로 사용)
    toPersistence(entity: CasinoGameSession): any {
        return {
            // id는 자동 생성이므로 제외 (또는 존재할 경우 포함)
            ...(entity.id && { id: entity.id }),
            uid: entity.uid,
            userId: entity.userId,
            playerName: entity.playerName,
            token: entity.token,
            aggregatorType: entity.aggregatorType,
            walletCurrency: entity.walletCurrency,
            gameCurrency: entity.gameCurrency,
            exchangeRate: entity.exchangeRate,
            exchangeRateSnapshotAt: entity.exchangeRateSnapshotAt,
            usdExchangeRate: entity.usdExchangeRate,
            compRate: entity.compRate,
            casinoGameId: entity.casinoGameId,
            // createdAt, updatedAt은 DB 기본값 사용 또는 엔티티 값 사용
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            lastAccessedAt: entity.lastAccessedAt,
        };
    }
}
