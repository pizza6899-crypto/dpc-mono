import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from '../ports';
import type { CategoryRepositoryPort } from '../ports';
import type { CasinoGameCategory } from '../domain';

interface FindCategoriesParams {
    isActive?: boolean;
}

@Injectable()
export class FindCategoriesService {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly repository: CategoryRepositoryPort,
    ) { }

    async execute({ isActive }: FindCategoriesParams = {}): Promise<CasinoGameCategory[]> {
        return await this.repository.list({ isActive });
    }
}
