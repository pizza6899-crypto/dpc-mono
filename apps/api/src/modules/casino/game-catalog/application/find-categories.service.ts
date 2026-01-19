import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from '../ports';
import type { CategoryRepositoryPort } from '../ports';
import type { CasinoGameCategory } from '../domain';
import { PaginatedData } from 'src/common/http/types';

interface FindCategoriesParams {
    isActive?: boolean;
    page?: number;
    limit?: number;
}

@Injectable()
export class FindCategoriesService {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly repository: CategoryRepositoryPort,
    ) { }

    async execute({ isActive, page = 1, limit = 20 }: FindCategoriesParams = {}): Promise<PaginatedData<CasinoGameCategory>> {
        const offset = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.repository.list({ isActive, limit, offset }),
            this.repository.count({ isActive }),
        ]);

        return {
            data,
            page,
            limit,
            total,
        };
    }
}
