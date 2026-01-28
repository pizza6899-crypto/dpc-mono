import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { UserTierAdminResponseDto } from '../controllers/admin/dto/user-tier-admin.response.dto';
import { GetUserTierDetailService } from './get-user-tier-detail.service'; // Reusing mapping logic? Or separate mapping?
// Better to reuse response mapping logic if possible or just use repository output directly.
// But we need to return DTOs.
// Let's reuse GetUserTierDetailService Logic or just map here for simplicity to avoid circular dependency if any.
// Actually GetUserTierDetailService maps one. Let's make a mapper or just map in controller. 
// Mapping services is cleaner. But for now let's map here.

import { UsersNeedingEvaluationResponseDto } from '../controllers/admin/dto/user-tier-admin.request.dto';

@Injectable()
export class GetUsersNeedingEvaluationService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute(): Promise<UsersNeedingEvaluationResponseDto[]> {
        // Needing evaluation implies admin wants to check *who* needs it.
        const now = new Date();
        const users = await this.userTierRepository.findUsersNeedingEvaluation(now);

        return users.map(userTier => ({
            userId: userTier.userId.toString(),
            tierId: userTier.tierId.toString(),
            tierName: userTier.tier?.getName() ?? 'Unknown',
            nextEvaluationAt: userTier.nextEvaluationAt,
            currentPeriodRollingUsd: userTier.currentPeriodRollingUsd.toString(),
            maintenanceRollingUsd: userTier.tier?.maintenanceRollingUsd.toString() ?? '0',
        }));
    }
}
