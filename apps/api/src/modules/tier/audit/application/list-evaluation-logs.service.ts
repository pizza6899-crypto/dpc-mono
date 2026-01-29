import { Injectable } from '@nestjs/common';
import { TierAuditRepositoryPort } from '../infrastructure/audit.repository.port';
import { TierEvaluationLog } from '../domain/tier-evaluation-log.entity';

@Injectable()
export class ListEvaluationLogsService {
    constructor(
        private readonly auditRepository: TierAuditRepositoryPort,
    ) { }

    async execute(limit: number = 20): Promise<TierEvaluationLog[]> {
        // We might need to add this to the repository port if not exists.
        // For now, let's assume we add it.
        // @ts-ignore
        return this.auditRepository.findEvaluationLogs(limit);
    }
}
