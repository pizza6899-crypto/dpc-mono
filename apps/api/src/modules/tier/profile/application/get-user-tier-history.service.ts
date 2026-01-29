import { Injectable } from '@nestjs/common';
import { TierAuditRepositoryPort } from '../../audit/infrastructure/audit.repository.port';
import { TierHistory } from '../../audit/domain/tier-history.entity';

@Injectable()
export class GetUserTierHistoryService {
    constructor(
        private readonly tierAuditRepository: TierAuditRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<TierHistory[]> {
        return this.tierAuditRepository.findHistoryByUserId(userId, 20); // Default limit 20
    }
}
