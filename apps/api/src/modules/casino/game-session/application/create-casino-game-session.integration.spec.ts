import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateCasinoGameSessionService } from './create-casino-game-session.service';
import { GameSessionModule } from '../game-session.module';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import {
    ExchangeCurrencyCode,
    GameAggregatorType,
    Prisma,
} from '@repo/database';
import { IdUtil } from 'src/utils/id.util';

describe('CreateCasinoGameSessionService (Integration)', () => {
    let service: CreateCasinoGameSessionService;
    let prisma: PrismaService;
    let exchangeRateService: ExchangeRateService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [GameSessionModule],
        }).compile();

        service = module.get<CreateCasinoGameSessionService>(CreateCasinoGameSessionService);
        prisma = module.get<PrismaService>(PrismaService);
        exchangeRateService = module.get<ExchangeRateService>(ExchangeRateService);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('SHOUlD create session with usdExchangeRate', async () => {
        // 1. Prepare Data
        const userId = BigInt(1); // Assuming user 1 exists or use a seed
        const walletCurrency = ExchangeCurrencyCode.KRW;
        const gameCurrency = ExchangeCurrencyCode.USD;

        // Mock Exchange Rates
        // KRW -> USD = 0.00075
        // KRW -> USD = 0.00075 (for tier rolling)
        jest.spyOn(exchangeRateService, 'getRate').mockResolvedValue(new Prisma.Decimal(0.00075));

        // 2. Execute
        const session = await service.execute({
            userId,
            aggregatorType: GameAggregatorType.WHITECLIFF, // or any valid type
            walletCurrency,
            gameCurrency,
            token: IdUtil.generateUrlSafeNanoid(32),
            playerName: 'test_player',
        });

        // 3. Verify
        expect(session).toBeDefined();
        expect(session.usdExchangeRate.toNumber()).toBe(0.00075);

        // Verify DB Persistence
        const dbSession = await prisma.casinoGameSession.findUnique({
            where: { id: session.id! },
        });
        expect(dbSession).toBeDefined();
        expect(dbSession?.usdExchangeRate.toNumber()).toBe(0.00075);

        // Cleanup
        await prisma.casinoGameSession.delete({ where: { id: session.id! } });
    });
});
