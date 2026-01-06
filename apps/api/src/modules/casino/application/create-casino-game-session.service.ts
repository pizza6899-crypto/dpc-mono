import { Inject, Injectable } from '@nestjs/common';
import {
    ExchangeCurrencyCode,
    GameAggregatorType,
} from '@repo/database';
import { CasinoGameSession } from '../domain/model/casino-game-session.entity';
import { CASINO_GAME_SESSION_REPOSITORY } from '../ports/out/casino-game-session.repository.token';
import type { CasinoGameSessionRepositoryPort } from '../ports/out/casino-game-session.repository.port';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import { generateUid } from 'src/utils/id.util';

interface CreateSessionParams {
    userId: bigint;
    gameId?: bigint;
    aggregatorType: GameAggregatorType;
    walletCurrency: ExchangeCurrencyCode;
    gameCurrency: ExchangeCurrencyCode;
    token: string;
}

@Injectable()
export class CreateCasinoGameSessionService {
    constructor(
        @Inject(CASINO_GAME_SESSION_REPOSITORY)
        private readonly repository: CasinoGameSessionRepositoryPort,
        private readonly exchangeRateService: ExchangeRateService,
    ) { }

    async execute(params: CreateSessionParams): Promise<CasinoGameSession> {
        const {
            userId,
            gameId,
            aggregatorType,
            walletCurrency,
            gameCurrency,
            token,
        } = params;

        // 1. 환율 조회 (세션 고정 환율)
        const exchangeRate = await this.exchangeRateService.getRate({
            fromCurrency: walletCurrency,
            toCurrency: gameCurrency,
        });

        // 2. 도메인 엔티티 생성
        const session = CasinoGameSession.create({
            uid: generateUid(),
            userId,
            token,
            aggregatorType,
            walletCurrency,
            gameCurrency,
            exchangeRate,
            gameId,
        });

        // 3. 저장
        return await this.repository.create(session);
    }
}
