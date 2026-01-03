import { Injectable, Inject } from '@nestjs/common';
import { UserDepositResponseDto } from '../dtos/deposit-address-user.dto';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DepositNotFoundException } from '../domain';

interface GetMyDepositDetailParams {
    uid: string;
    userId: bigint;
}

@Injectable()
export class GetMyDepositDetailService {
    constructor(
        @Inject(DEPOSIT_DETAIL_REPOSITORY)
        private readonly depositRepository: DepositDetailRepositoryPort,
    ) { }

    async execute(params: GetMyDepositDetailParams): Promise<UserDepositResponseDto> {
        const { uid, userId } = params;

        const deposit = await this.depositRepository.findByUidAndUserId(uid, userId);

        if (!deposit) {
            throw new DepositNotFoundException(uid);
        }

        const amount = deposit.getAmount();
        // 엔티티를 DTO로 매핑
        return {
            uid: deposit.uid,
            status: deposit.status,
            methodType: deposit.getMethod().methodType,
            provider: deposit.getMethod().provider as any,

            requestedAmount: amount.requestedAmount.toString(),
            actuallyPaid: amount.actuallyPaid?.toString() ?? null,
            feeAmount: amount.feeAmount?.toString() ?? null,
            depositCurrency: deposit.depositCurrency,

            walletAddress: deposit.walletAddress,
            depositNetwork: deposit.depositNetwork,

            bankName: null, // 임시처리

            createdAt: deposit.createdAt,
            confirmedAt: deposit.confirmedAt ?? null,
            failedAt: deposit.failedAt ?? null,
            failureReason: deposit.failureReason ?? null,
        } as UserDepositResponseDto;
    }
}
