import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from '../ports';
import type { CategoryRepositoryPort } from '../ports';
import type { CasinoGameCategory } from '../domain';

interface GetCategoryByCodeParams {
    code: string;
}

@Injectable()
export class GetCategoryByCodeService {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly repository: CategoryRepositoryPort,
    ) { }

    async execute({ code }: GetCategoryByCodeParams): Promise<CasinoGameCategory> {
        return await this.repository.getByCode(code);
    }
}
