import { Inject, Injectable } from '@nestjs/common';
import { Tier } from '../domain';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import { TIER_REPOSITORY } from '../ports/repository.token';
import { TierException } from '../domain/tier.exception';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

interface CreateTierCommand {
    priority: number;
    code: string;
    requirementUsd: number;
    levelUpBonusUsd?: number;
    compRate?: number;
}

@Injectable()
export class CreateTierService {
    constructor(
        @Inject(TIER_REPOSITORY)
        private readonly tierRepository: TierRepositoryPort,
        private readonly advisoryLockService: AdvisoryLockService,
    ) { }

    @Transactional()
    async execute(command: CreateTierCommand): Promise<Tier> {
        // Serializes tier creation to prevent concurrent duplicates beyond DB constraint
        await this.advisoryLockService.acquireLock(LockNamespace.TIER_CREATION, '0', {
            throwThrottleError: true
        });

        const existingCode = await this.tierRepository.findByCode(command.code);
        if (existingCode) {
            throw new TierException(`Tier with code ${command.code} already exists`);
        }

        const existingPriority = await this.tierRepository.findByPriority(command.priority);
        if (existingPriority) {
            throw new TierException(`Tier with priority ${command.priority} already exists`);
        }

        const tier = Tier.create({
            priority: command.priority,
            code: command.code,
            requirementUsd: command.requirementUsd,
            levelUpBonusUsd: command.levelUpBonusUsd,
            compRate: command.compRate,
        });

        return this.tierRepository.create(tier);
    }
}
