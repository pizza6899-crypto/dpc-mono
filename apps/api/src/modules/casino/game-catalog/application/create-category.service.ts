import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from '../ports';
import type { CategoryRepositoryPort } from '../ports';
import { CasinoGameCategory, CategoryAlreadyExistsException } from '../domain';
import { CategoryType, Language } from '@repo/database';

interface CreateCategoryParams {
    code: string;
    type: CategoryType;
    iconUrl?: string;
    bannerUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
    isSystem?: boolean;
    translations: {
        language: Language;
        name: string;
        description?: string;
    }[];
}

@Injectable()
export class CreateCategoryService {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly repository: CategoryRepositoryPort,
    ) { }

    async execute(params: CreateCategoryParams): Promise<CasinoGameCategory> {
        const existing = await this.repository.findByCode(params.code);
        if (existing) {
            throw new CategoryAlreadyExistsException(params.code);
        }

        const category = CasinoGameCategory.create(params);
        return await this.repository.create(category);
    }
}
