import { Injectable, Inject, Logger } from '@nestjs/common';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { GetDepositsQueryDto } from '../dtos/get-deposits-query.dto';
import { UserDepositResponseDto } from '../dtos/deposit-address-user.dto';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';

interface GetMyDepositsParams {
    query: GetDepositsQueryDto;
    userId: bigint;
    requestInfo: RequestClientInfo;
}

@Injectable()
export class GetMyDepositsService {
    private readonly logger = new Logger(GetMyDepositsService.name);

    constructor(
        @Inject(DEPOSIT_DETAIL_REPOSITORY)
        private readonly depositRepository: DepositDetailRepositoryPort,
    ) { }

    async execute(params: GetMyDepositsParams): Promise<PaginatedData<UserDepositResponseDto>> {
        const { query, userId } = params;
        const { page = 1, limit = 20 } = query;

        const { items, total } = await this.depositRepository.listByUserId(userId, {
            skip: (page - 1) * limit,
            take: limit,
            ...query,
        });

        return {
            data: items.map((deposit) => {
                // 엔티티를 DTO로 매핑
                const amount = deposit.getAmount();
                return {
                    uid: deposit.uid,
                    status: deposit.status,
                    methodType: deposit.getMethod().methodType,
                    provider: deposit.getMethod().provider as any,

                    requestedAmount: amount.requestedAmount.toString(),
                    actuallyPaid: amount.actuallyPaid?.toString() ?? null,
                    feeAmount: amount.feeAmount?.toString() ?? null,
                    depositCurrency: deposit.depositCurrency,

                    // 암호화폐 정보
                    walletAddress: deposit.walletAddress,
                    depositNetwork: deposit.depositNetwork,

                    // 계좌 정보
                    bankName: deposit.bankName ?? null,

                    createdAt: deposit.createdAt,
                    confirmedAt: deposit.confirmedAt ?? null,
                    failedAt: deposit.failedAt ?? null,
                    failureReason: deposit.failureReason ?? null,
                } as UserDepositResponseDto;
            }),
            page,
            limit,
            total,
        };
    }
}
