import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { UserTierStatus } from '@prisma/client';

export interface UpdateUserTierStatusCommand {
    userId: bigint;
    status: UserTierStatus;
    reason?: string;
}

@Injectable()
export class UpdateUserTierStatusService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute(command: UpdateUserTierStatusCommand): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(command.userId);
        if (!userTier) {
            throw new NotFoundException(`User tier record not found for user ${command.userId}`);
        }

        // Validate status transition if needed
        if (userTier.status === command.status) {
            return;
        }

        userTier.status = command.status;

        // If locked, we might want to clear grace periods or warnings?
        // Or keep them but not evaluate? BatchEvaluation checks status?
        // Let's check BatchEvaluationService filter.

        if (command.status === UserTierStatus.LOCKED) {
            userTier.note = command.reason ? `[LOCKED] ${command.reason}` : userTier.note;
        } else if (userTier.status === UserTierStatus.LOCKED && command.status === UserTierStatus.ACTIVE) {
            userTier.note = command.reason ? `[UNLOCKED] ${command.reason}` : userTier.note;
        }

        await this.userTierRepository.save(userTier);
    }
}
