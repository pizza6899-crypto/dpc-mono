import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { CryptoWithdrawConfig, CryptoWithdrawConfigAlreadyExistsException } from '../domain';
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
        // 이미 존재하는지 확인 (symbol + network) - 삭제된 것 포함
        const existing = await this.repository.findCryptoConfigBySymbolAndNetwork(
            params.symbol,
            params.network,
            true, // includeDeleted
        );

        if (existing) {
            // 삭제되지 않은 데이터가 있으면 중복 에러
            if (!existing.props.deletedAt) {
                throw new CryptoWithdrawConfigAlreadyExistsException(params.symbol, params.network);
            }

            // 삭제된 데이터가 있으면 복구 후 업데이트
            existing.restore();
            existing.update({
                isActive: params.isActive,
                minWithdrawAmount: new Prisma.Decimal(params.minWithdrawAmount),
                maxWithdrawAmount: params.maxWithdrawAmount ? new Prisma.Decimal(params.maxWithdrawAmount) : null,
                autoProcessLimit: params.autoProcessLimit ? new Prisma.Decimal(params.autoProcessLimit) : null,
                withdrawFeeFixed: new Prisma.Decimal(params.withdrawFeeFixed),
                withdrawFeeRate: new Prisma.Decimal(params.withdrawFeeRate),
            });
            return await this.repository.saveCryptoConfig(existing);
        }

        // 데이터가 전혀 없으면 신규 생성
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
