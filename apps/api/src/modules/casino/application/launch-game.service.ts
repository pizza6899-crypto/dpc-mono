import { Injectable, Logger } from '@nestjs/common';
import { FindGameByIdService } from '../game-catalog/application/find-game-by-id.service';
import { FindGameProviderByIdService } from '../aggregator/application/provider/find-game-provider-by-id.service';
import { AggregatorRegistryService } from '../aggregator/application/aggregator-registry.service';
import { WhitecliffGameService } from '../providers/whitecliff/application/whitecliff-game.service';
import { DcsGameService } from '../providers/dcs/application/dcs-game.service';
import { CasinoAggregator } from '../aggregator/domain';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import type { RequestClientInfo } from 'src/common/http/types';
import type { GamingCurrencyCode, WalletCurrencyCode } from 'src/utils/currency.util';

interface LaunchGameParams {
    gameId: bigint;
    isMobile: boolean;
    walletCurrency: WalletCurrencyCode;
    gameCurrency: GamingCurrencyCode;
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
    ) { }

    async execute(
        user: CurrentUserWithSession,
        params: LaunchGameParams,
        requestInfo: RequestClientInfo,
    ): Promise<LaunchGameResult> {
        const { gameId, isMobile, walletCurrency, gameCurrency } = params;

        // 1. Get Game Entity (GameCatalog)
        const game = await this.findGameByIdService.execute(gameId);

        // 2. Get Provider Entity (Aggregator)
        const provider = await this.findGameProviderService.execute({
            id: game.providerId,
        });

        // 3. Get Aggregator to determine type/code
        const aggregator = this.aggregatorRegistryService.getById(provider.aggregatorId);

        // 4. Dispatch to worker service based on aggregator code
        if (aggregator.code === CasinoAggregator.CODE_WC) {
            return await this.whitecliffGameService.launchGame(
                user,
                {
                    game,
                    provider,
                    isMobile,
                    walletCurrency,
                    gameCurrency,
                },
                requestInfo,
            );
        } else if (aggregator.code === CasinoAggregator.CODE_DC) {
            return await this.dcsGameService.launchGame({
                user,
                game,
                provider,
                isMobile,
                gameCurrency,
                walletCurrency,
                requestInfo,
            });
        }

        throw new Error(`Unsupported aggregator code: ${aggregator.code}`);
    }
}
