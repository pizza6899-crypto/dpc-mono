import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from '../ports';
import type { CategoryRepositoryPort } from '../ports';

@Injectable()
export class DeleteCategoryService {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly repository: CategoryRepositoryPort,
    ) { }

    async execute(id: bigint): Promise<void> {
        await this.repository.getById(id); // Check existence
        await this.repository.delete(id);
    }
}
