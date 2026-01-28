import { Injectable } from '@nestjs/common';
import { TierAuditRepositoryPort } from '../../audit/infrastructure/audit.repository.port';
import { UserTierHistoryResponseDto } from '../controllers/public/dto/user-tier-history.response.dto';

@Injectable()
export class GetUserTierHistoryService {
    constructor(
        private readonly tierAuditRepository: TierAuditRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<UserTierHistoryResponseDto[]> {
        const history = await this.tierAuditRepository.findHistoryByUserId(userId, 20); // Default limit 20

        return history.map(h => ({
            id: h.id.toString(),
            fromTierId: h.fromTierId?.toString() ?? null,
            toTierId: h.toTierId.toString(),
            changeType: h.changeType,
            reason: h.reason,
            changedAt: h.changedAt,
            rollingAmountSnap: h.rollingAmountSnap.toString(),
            depositAmountSnap: h.depositAmountSnap.toString(),
        }));
    }
}
