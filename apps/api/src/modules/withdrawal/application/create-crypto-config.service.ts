import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { CryptoWithdrawConfig } from '../domain';
import { type WithdrawalRepositoryPort } from '../ports/withdrawal.repository.port';
import { WITHDRAWAL_REPOSITORY } from '../ports/withdrawal.repository.token';

export interface CreateCryptoConfigParams {
    symbol: string;
    network: string;
    isActive: boolean;
    minWithdrawAmount: string;
    maxWithdrawAmount?: string;
    autoProcessLimit?: string;
    withdrawFeeFixed: string;
    withdrawFeeRate: string;
}

@Injectable()
export class CreateCryptoConfigService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
        private readonly snowflakeService: SnowflakeService,
    ) { }

    async execute(params: CreateCryptoConfigParams): Promise<CryptoWithdrawConfig> {
        // 이미 존재하는지 확인 (symbol + network)
        const existing = await this.repository.findCryptoConfigBySymbolAndNetwork(
            params.symbol,
            params.network,
        );
        if (existing) {
            // 중복 생성 방지 에러 (혹은 복구 로직)
            throw new Error(`Config for ${params.symbol} on ${params.network} already exists`);
        }

        const now = new Date();
        const id = this.snowflakeService.generate(now);
        const config = CryptoWithdrawConfig.createNew(id, {
            symbol: params.symbol,
            network: params.network,
            isActive: params.isActive,
            minWithdrawAmount: new Prisma.Decimal(params.minWithdrawAmount),
            maxWithdrawAmount: params.maxWithdrawAmount ? new Prisma.Decimal(params.maxWithdrawAmount) : null,
            autoProcessLimit: params.autoProcessLimit ? new Prisma.Decimal(params.autoProcessLimit) : null,
            withdrawFeeFixed: new Prisma.Decimal(params.withdrawFeeFixed),
            withdrawFeeRate: new Prisma.Decimal(params.withdrawFeeRate),
        });

        return await this.repository.saveCryptoConfig(config);
    }
}
