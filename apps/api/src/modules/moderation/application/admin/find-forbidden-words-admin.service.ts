import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ForbiddenWordRepositoryPort } from '../../ports/out/moderation-repository.port';
import { FORBIDDEN_WORD_REPOSITORY } from '../../ports/out/moderation-repository.port';
import { ForbiddenWord } from '../../domain/model/forbidden-word.entity';
import type { PaginatedData } from 'src/common/http/types/pagination.types';

export interface FindForbiddenWordsAdminQuery {
    page: number;
    limit: number;
    keyword?: string;
    isActive?: boolean;
}

@Injectable()
export class FindForbiddenWordsAdminService {
    constructor(
        @Inject(FORBIDDEN_WORD_REPOSITORY)
        private readonly forbiddenWordRepository: ForbiddenWordRepositoryPort,
    ) { }

    async execute(query: FindForbiddenWordsAdminQuery): Promise<PaginatedData<ForbiddenWord>> {
        const skip = (query.page - 1) * query.limit;
        const take = query.limit;

        const [items, total] = await Promise.all([
            this.forbiddenWordRepository.findMany({
                skip,
                take,
                keyword: query.keyword,
                isActive: query.isActive,
            }),
            this.forbiddenWordRepository.count({
                keyword: query.keyword,
                isActive: query.isActive,
            }),
        ]);

        return {
            data: items,
            page: query.page,
            limit: query.limit,
            total,
        };
    }

}
