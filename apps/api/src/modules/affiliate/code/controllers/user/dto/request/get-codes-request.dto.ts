import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

export class GetCodesRequestDto extends createPaginationQueryDto({
    defaultLimit: 20,
    maxLimit: 50,
    allowedSortFields: ['createdAt', 'lastUsedAt'],
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
}) { }
