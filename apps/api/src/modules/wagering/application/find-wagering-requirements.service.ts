import { Inject, Injectable } from '@nestjs/common';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { WageringRequirement } from '../domain';
import type { WageringStatus } from '@repo/database';
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
        userId: bigint;
        statuses?: WageringStatus[];
        page: number;
        limit: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<PaginatedData<WageringRequirement>> {
        return await this.repository.findPaginated(params);
    }
}
