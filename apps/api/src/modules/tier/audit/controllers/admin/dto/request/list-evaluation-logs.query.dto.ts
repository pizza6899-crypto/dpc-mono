import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

export class ListEvaluationLogsQueryDto extends createPaginationQueryDto({ defaultSortBy: 'startedAt' }, ['startedAt']) { }
