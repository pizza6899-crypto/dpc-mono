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

    /**
     * 여러 대상(Targets)에 연결된 메모들을 일괄 조회합니다. (Batch Fetching)
     */
    async findByTargets(type: AdminMemoTargetType, targetIds: bigint[]): Promise<AdminMemo[]> {
        return this.adminMemoRepository.findByTargets(type, targetIds);
    }

    /**
     * 여러 대상(Targets)에 연결된 메모 개수를 일괄 조회합니다. (Batch Fetching)
     */
    async findCountsByTargets(type: AdminMemoTargetType, targetIds: bigint[]): Promise<Map<bigint, number>> {
        return this.adminMemoRepository.findCountsByTargets(type, targetIds);
    }

    /**
     * 여러 대상(Targets)의 최신 메모 1건씩을 일괄 조회합니다. (Batch Fetching)
     */
    async findLatestByTargets(type: AdminMemoTargetType, targetIds: bigint[]): Promise<Map<bigint, AdminMemo>> {
        return this.adminMemoRepository.findLatestByTargets(type, targetIds);
    }
}
