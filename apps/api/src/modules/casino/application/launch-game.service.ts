import { Injectable, Logger } from '@nestjs/common';
import type { GamingCurrencyCode, WalletCurrencyCode } from 'src/utils/currency.util';
import { FindGameByIdService } from '../game-catalog/application/find-game-by-id.service';
import { FindGameProviderByIdService } from '../aggregator/application/provider/find-game-provider-by-id.service';
import { AggregatorRegistryService } from '../aggregator/application/aggregator-registry.service';
import { WhitecliffGameService } from '../providers/whitecliff/application/whitecliff-game.service';
import { DcsGameService } from '../providers/dcs/application/dcs-game.service';
import { CasinoLaunchPolicy } from '../domain/casino-launch.policy';
import { CasinoAggregatorUnsupportedException } from '../aggregator/domain/casino-aggregator.exception';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import type { RequestClientInfo } from 'src/common/http/types';
import { Language, GameAggregatorType } from '@prisma/client';
import { AGGREGATOR_CODE_MAP } from '../aggregator/ports/aggregator-game.dto';

interface LaunchGameParams {
    gameId: bigint;
    isMobile: boolean;
    walletCurrency: WalletCurrencyCode;
    gameCurrency: GamingCurrencyCode;
    language?: Language;
}

interface LaunchGameResult {
    gameUrl: string;
}

@Injectable()
export class LaunchGameService {
    private readonly logger = new Logger(LaunchGameService.name);

    constructor(
        private readonly findGameByIdService: FindGameByIdService,
        private readonly findGameProviderService: FindGameProviderByIdService,
        private readonly aggregatorRegistryService: AggregatorRegistryService,
        private readonly whitecliffGameService: WhitecliffGameService,
        private readonly dcsGameService: DcsGameService,
        private readonly casinoLaunchPolicy: CasinoLaunchPolicy,
    ) { }

    async execute(
        user: CurrentUserWithSession,
        params: LaunchGameParams,
        requestInfo: RequestClientInfo,
    ): Promise<LaunchGameResult> {
        const { gameId, isMobile, walletCurrency, gameCurrency, language } = params;

        // 1. Get Game Entity (GameCatalog)
        const game = await this.findGameByIdService.execute(gameId);

        // 2. Get Provider Entity (Aggregator)
        const provider = await this.findGameProviderService.execute({
            id: game.providerId,
        });

        // 3. Get Aggregator to determine type/code
        const aggregator = this.aggregatorRegistryService.getById(provider.aggregatorId);

        // 4. Validate Policies (Game Enabled, Provider Active, Aggregator Active, User Valid, etc.)
        this.casinoLaunchPolicy.validate(user, game, provider, aggregator, {
            walletCurrency,
            gameCurrency,
        });

        // 5. Dispatch to worker service based on aggregator code
        if (aggregator.code === AGGREGATOR_CODE_MAP[GameAggregatorType.WHITECLIFF]) {
            return await this.whitecliffGameService.launchGame(
                user,
                {
                    game,
                    provider,
                    isMobile,
                    walletCurrency,
                    gameCurrency,
                    language,
                },
                requestInfo,
            );
        } else if (aggregator.code === AGGREGATOR_CODE_MAP[GameAggregatorType.DC]) {
            return await this.dcsGameService.launchGame({
                user,
                game,
                provider,
                isMobile,
                gameCurrency,
                walletCurrency,
                language,
                requestInfo,
            });
        }

        throw new CasinoAggregatorUnsupportedException(aggregator.code);
    }
}
