import { Inject, Injectable } from '@nestjs/common';
import {
    ADMIN_MEMO_REPOSITORY,
    type AdminMemoRepositoryPort,
} from '../ports/out';
import { AdminMemo } from '../domain';

@Injectable()
export class FindAdminMemoService {
    constructor(
        @Inject(ADMIN_MEMO_REPOSITORY)
        private readonly adminMemoRepository: AdminMemoRepositoryPort,
    ) { }

    /**
     * 특정 입금 ID에 연결된 메모를 조회합니다. (최신순)
     */
    async findByDepositId(depositId: bigint, limit = 50): Promise<AdminMemo[]> {
        return this.adminMemoRepository.findByDepositId(depositId, limit);
    }
}
