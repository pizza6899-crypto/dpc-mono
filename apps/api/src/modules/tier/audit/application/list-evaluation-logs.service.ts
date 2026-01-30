import { Injectable } from '@nestjs/common';
import { TierAuditRepositoryPort } from '../infrastructure/audit.repository.port';
import { TierEvaluationLog } from '../domain/tier-evaluation-log.entity';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { ListEvaluationLogsQueryDto } from '../controllers/admin/dto/request/list-evaluation-logs.query.dto';

@Injectable()
export class ListEvaluationLogsService {
    constructor(
        private readonly auditRepository: TierAuditRepositoryPort,
    ) { }

    async execute(query: ListEvaluationLogsQueryDto): Promise<PaginatedData<TierEvaluationLog>> {
        return this.auditRepository.findEvaluationLogs(query.page, query.limit);
    }
}
