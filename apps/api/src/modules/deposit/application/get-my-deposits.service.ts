import { Injectable, Inject } from '@nestjs/common';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DepositDetail } from '../domain';

interface GetMyDepositsParams {
    query: any;
    userId: bigint;
    requestInfo: RequestClientInfo;
}

@Injectable()
export class GetMyDepositsService {
    constructor(
        @Inject(DEPOSIT_DETAIL_REPOSITORY)
        private readonly depositRepository: DepositDetailRepositoryPort,
    ) { }

    async execute(params: GetMyDepositsParams): Promise<PaginatedData<DepositDetail>> {
        const { query, userId } = params;
        const { page = 1, limit = 20 } = query;

        const { items, total } = await this.depositRepository.listByUserId(userId, {
            skip: (page - 1) * limit,
            take: limit,
            ...query,
        });

        return {
            data: items,
            page,
            limit,
            total,
        };
    }
}
