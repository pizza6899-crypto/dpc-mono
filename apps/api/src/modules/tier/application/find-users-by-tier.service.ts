import { Inject, Injectable } from '@nestjs/common';
import { USER_TIER_REPOSITORY } from '../ports/repository.token';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import { UserTier } from '../domain';

interface FindUsersByTierParams {
    tierId: bigint;
    page: number;
    limit: number;
}

@Injectable()
export class FindUsersByTierService {
    constructor(
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute({ tierId, page, limit }: FindUsersByTierParams): Promise<[UserTier[], number]> {
        const skip = (page - 1) * limit;
        const take = limit;
        return this.userTierRepository.findManyByTierId(tierId, skip, take);
    }
}
