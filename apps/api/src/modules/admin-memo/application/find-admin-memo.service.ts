import { Inject, Injectable } from '@nestjs/common';
import {
    ADMIN_MEMO_REPOSITORY,
    type AdminMemoRepositoryPort,
} from '../ports/out';
import { AdminMemo, AdminMemoTargetType } from '../domain';

@Injectable()
export class FindAdminMemoService {
    constructor(
        @Inject(ADMIN_MEMO_REPOSITORY)
        private readonly adminMemoRepository: AdminMemoRepositoryPort,
    ) { }

    /**
     * 특정 대상(Target)에 연결된 메모를 조회합니다. (최신순)
     */
    async findByTarget(type: AdminMemoTargetType, targetId: bigint, limit = 50): Promise<AdminMemo[]> {
        return this.adminMemoRepository.findByTarget(type, targetId, limit);
    }
}
