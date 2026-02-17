import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';

export interface WageringWithdrawalEligibility {
    isRestricted: boolean;
    activeCount: number;
    totalRemainingAmount: string;
    lastContributedAt: Date | null;
}

@Injectable()
export class CheckWageringRequirementService {
    constructor(
        @Inject(WAGERING_REQUIREMENT_REPOSITORY)
        private readonly repository: WageringRequirementRepositoryPort,
    ) { }

    /**
     * 유저의 출금 가능 여부 및 롤링 요약 정보를 확인합니다.
     */
    async getSummary(userId: bigint): Promise<WageringWithdrawalEligibility> {
        const activeRequirements = await this.repository.findByUserId(userId, 'ACTIVE');

        if (activeRequirements.length === 0) {
            return {
                isRestricted: false,
                activeCount: 0,
                totalRemainingAmount: '0',
                lastContributedAt: null,
            };
        }

        // 여러 통화가 섞여 있을 수 있으므로, 첫 번째 발견된 롤링의 통화를 기준으로 합산하거나
        // 통화별로 분리하는 것이 맞지만, 현재 DTO 구조상 첫 번째 통화를 우선시함
        const baseCurrency = activeRequirements[0].currency;
        const sameCurrencyRequirements = activeRequirements.filter(r => r.currency === baseCurrency);

        const totalRemaining = sameCurrencyRequirements.reduce(
            (acc, item) => acc.add(item.remainingAmount),
            new Prisma.Decimal(0)
        );

        const lastContributedAt = activeRequirements
            .map(item => item.lastContributedAt)
            .filter((date): date is Date => date !== null)
            .sort((a, b) => b.getTime() - a.getTime())[0] || null;

        return {
            isRestricted: true,
            activeCount: activeRequirements.length,
            totalRemainingAmount: totalRemaining.toString(),
            lastContributedAt,
        };
    }

    /**
     * 단순 출금 가능 여부만 빠르게 확인 (출금 서비스 등에서 사용)
     */
    async checkWithdrawalEligibility(userId: bigint): Promise<{ isRestricted: boolean }> {
        const activeRequirements = await this.repository.findByUserId(userId, 'ACTIVE');
        return {
            isRestricted: activeRequirements.length > 0,
        };
    }
}
