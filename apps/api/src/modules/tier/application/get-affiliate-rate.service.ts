// src/modules/tier/application/get-affiliate-rate.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import { USER_TIER_REPOSITORY } from '../ports/repository.token';
import { UserTierNotFoundException } from '../domain';

interface GetAffiliateRateResult {
    rate: Prisma.Decimal;
    isCustom: boolean;
}

@Injectable()
export class GetAffiliateRateService {
    constructor(
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<GetAffiliateRateResult> {
        // TODO: Tier/UserTier 스키마에 어필리에이트 요율 필드가 정의될 때까지 임시로 0 반환
        return {
            rate: new Prisma.Decimal(0),
            isCustom: false,
        };
    }
}
