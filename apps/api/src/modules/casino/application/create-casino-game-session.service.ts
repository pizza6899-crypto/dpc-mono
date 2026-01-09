import { Inject, Injectable } from '@nestjs/common';
import {
    ExchangeCurrencyCode,
    GameAggregatorType,
    Prisma,
} from '@repo/database';
import { CasinoGameSession } from '../domain/model/casino-game-session.entity';
import { CASINO_GAME_SESSION_REPOSITORY } from '../ports/out/casino-game-session.repository.token';
import type { CasinoGameSessionRepositoryPort } from '../ports/out/casino-game-session.repository.port';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import { generateUid } from 'src/utils/id.util';
import { GetUserTierService } from '../../tier/application/get-user-tier.service';

interface CreateSessionParams {
    userId: bigint;
    gameId?: bigint;
    aggregatorType: GameAggregatorType;
    walletCurrency: ExchangeCurrencyCode;
    gameCurrency: ExchangeCurrencyCode;
    token: string;
    playerName: string;
}

@Injectable()
export class CreateCasinoGameSessionService {
    constructor(
        @Inject(CASINO_GAME_SESSION_REPOSITORY)
        private readonly repository: CasinoGameSessionRepositoryPort,
        private readonly exchangeRateService: ExchangeRateService,
        private readonly getUserTierService: GetUserTierService,
    ) { }

    async execute(params: CreateSessionParams): Promise<CasinoGameSession> {
        const {
            userId,
            gameId,
            aggregatorType,
            walletCurrency,
            gameCurrency,
            token,
            playerName,
        } = params;

        // 1. 환율 조회 (세션 고정 환율)
        const exchangeRate = await this.exchangeRateService.getRate({
            fromCurrency: walletCurrency,
            toCurrency: gameCurrency,
        });

        // 2. USD 환율 조회 (Tier Rolling 용)
        const usdExchangeRate = await this.exchangeRateService.getRate({
            fromCurrency: walletCurrency,
            toCurrency: ExchangeCurrencyCode.USD,
        });

        // 3. 유저 티어 정보 조회 (콤프 요율 적용)
        const userTier = await this.getUserTierService.execute(userId);
        const compRate = userTier?.tier?.compRate || new Prisma.Decimal(0);

        // 4. 도메인 엔티티 생성
        const session = CasinoGameSession.create({
            uid: generateUid(),
            userId,
            playerName, // playername 추가
            token,
            aggregatorType,
            walletCurrency,
            gameCurrency,
            exchangeRate,
            usdExchangeRate,
            compRate,
            casinoGameId: gameId,
        });

        // 5. 저장
        return await this.repository.create(session);
    }
}
