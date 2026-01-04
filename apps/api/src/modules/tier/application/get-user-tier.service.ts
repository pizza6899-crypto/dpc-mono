import { Inject, Injectable } from '@nestjs/common';
import { UserTier } from '../domain';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import { USER_TIER_REPOSITORY } from '../ports/repository.token';

@Injectable()
export class GetUserTierService {
    constructor(
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<UserTier | null> {
        return this.userTierRepository.findByUserId(userId);
    }
}
