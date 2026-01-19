import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from '../ports';
import type { CategoryRepositoryPort } from '../ports';
import { CasinoGameCategory } from '../domain';
import { Language } from '@repo/database';

interface UpdateCategoryParams {
    id: bigint;
    iconUrl?: string | null;
    bannerUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    translations?: {
        language: Language;
        name: string;
        description?: string | null;
    }[];
}

@Injectable()
export class UpdateCategoryService {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly repository: CategoryRepositoryPort,
    ) { }

    async execute(params: UpdateCategoryParams): Promise<CasinoGameCategory> {
        const category = await this.repository.getById(params.id);

        category.update({
            iconUrl: params.iconUrl,
            bannerUrl: params.bannerUrl,
            sortOrder: params.sortOrder,
            isActive: params.isActive,
            translations: params.translations,
        });

        return await this.repository.update(category);
    }
}
