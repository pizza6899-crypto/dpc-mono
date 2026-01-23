import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Tier } from '../domain';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import { TIER_REPOSITORY } from '../ports/repository.token';
import { TierNotFoundException, TierException } from '../domain/tier.exception';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

interface UpdateTierCommand {
    id: bigint;
    priority?: number;
    code?: string;
    requirementUsd?: number;
    levelUpBonusUsd?: number;
    compRate?: number;
}

import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class UpdateTierService {
    constructor(
        @Inject(TIER_REPOSITORY)
        private readonly tierRepository: TierRepositoryPort,
        private readonly advisoryLockService: AdvisoryLockService,
    ) { }

    @Transactional()
    async execute(command: UpdateTierCommand): Promise<Tier> {
        // Serializes tier updates to prevent concurrent duplicates/race conditions
        await this.advisoryLockService.acquireLock(LockNamespace.TIER_CREATION, '0', {
            throwThrottleError: true
        });

        const tier = await this.tierRepository.findById(command.id);
        if (!tier) {
            throw new TierNotFoundException(command.id);
        }

        // Check conflicts if priority or code changed
        if (command.code && command.code !== tier.code) {
            const existing = await this.tierRepository.findByCode(command.code);
            if (existing && existing.id !== tier.id) throw new TierException(`Tier code ${command.code} is already in use`);
        }

        if (command.priority !== undefined && command.priority !== tier.priority) {
            const existing = await this.tierRepository.findByPriority(command.priority);
            if (existing && existing.id !== tier.id) throw new TierException(`Tier priority ${command.priority} is already in use`);
        }

        const updatedTier = Tier.fromPersistence({
            ...tier.toPersistence(),
            id: command.id,
            priority: command.priority ?? tier.priority,
            code: command.code ?? tier.code,
            requirementUsd: command.requirementUsd !== undefined ? new Prisma.Decimal(command.requirementUsd) : tier.requirementUsd,
            levelUpBonusUsd: command.levelUpBonusUsd !== undefined ? new Prisma.Decimal(command.levelUpBonusUsd) : tier.levelUpBonusUsd,
            compRate: command.compRate !== undefined ? new Prisma.Decimal(command.compRate) : tier.compRate,
            updatedAt: new Date(),
        });

        return this.tierRepository.update(updatedTier);
    }
}
