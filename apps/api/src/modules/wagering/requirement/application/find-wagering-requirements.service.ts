import { Inject, Injectable } from '@nestjs/common';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { WageringRequirement } from '../domain';
import type { WageringStatus, ExchangeCurrencyCode, WageringSourceType } from '@prisma/client';
import type { PaginatedData } from 'src/common/http/types/pagination.types';

@Injectable()
export class FindWageringRequirementsService {
    constructor(
        @Inject(WAGERING_REQUIREMENT_REPOSITORY)
        private readonly repository: WageringRequirementRepositoryPort,
    ) { }

    async findByUserId(userId: bigint, status?: WageringStatus): Promise<WageringRequirement[]> {
        return await this.repository.findByUserId(userId, status);
    }

    async findById(id: bigint): Promise<WageringRequirement | null> {
        return await this.repository.findById(id);
    }

    async findPaginated(params: {
        userId?: bigint;
        statuses?: WageringStatus[];
        sourceType?: WageringSourceType;
        sourceId?: bigint;
        currency?: ExchangeCurrencyCode;
        fromAt?: Date;
        toAt?: Date;
        page: number;
        limit: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<PaginatedData<WageringRequirement>> {
        return await this.repository.findPaginated(params);
    }

    /**
     * 특정 소스(입금, 프로모션 등)로 생성된 가장 최근의 롤링 조건을 조회합니다.
     * 외부 모듈(예: Promotion)에서 상태 확인용으로 사용합니다.
     */
    async findLatestBySource(userId: bigint, sourceType: WageringSourceType, sourceId: bigint): Promise<WageringRequirement | null> {
        return await this.repository.findLatestBySource(userId, sourceType, sourceId);
    }
}
