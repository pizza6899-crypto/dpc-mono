import { Inject, Injectable } from '@nestjs/common';
import { type ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';

export interface WageringWithdrawalEligibility {
  currency: ExchangeCurrencyCode; // 대상 통화
  isRestricted: boolean; // 출금 제한 여부
  activeCount: number; // 활성 롤링 조건 수
  totalRequiredAmount: string; // 총 요구 금액
  totalFulfilledAmount: string; // 총 달성 금액
  totalRemainingAmount: string; // 총 남은 금액
  lastContributedAt: Date | null; // 마지막 기여 발생일
}

@Injectable()
export class CheckWageringRequirementService {
  constructor(
    @Inject(WAGERING_REQUIREMENT_REPOSITORY)
    private readonly repository: WageringRequirementRepositoryPort,
  ) {}

  /**
   * 유저의 출금 가능 여부 및 롤링 요약 정보를 확인합니다.
   */
  async getSummary(
    userId: bigint,
    requestedCurrency: ExchangeCurrencyCode,
  ): Promise<WageringWithdrawalEligibility> {
    const activeRequirements = await this.repository.findByUserId(
      userId,
      'ACTIVE',
    );

    if (activeRequirements.length === 0) {
      return {
        currency: requestedCurrency, // 기본값은 KRW 또는 요청 통화
        isRestricted: false,
        activeCount: 0,
        totalRequiredAmount: '0',
        totalFulfilledAmount: '0',
        totalRemainingAmount: '0',
        lastContributedAt: null,
      };
    }

    // 통화 필터링: 요청된 통화가 있으면 해당 통화만, 없으면 첫 번째 롤링의 통화 기준
    const targetCurrency = requestedCurrency ?? activeRequirements[0].currency;
    const sameCurrencyRequirements = activeRequirements.filter(
      (r) => r.currency === targetCurrency,
    );

    if (sameCurrencyRequirements.length === 0) {
      return {
        currency: targetCurrency,
        isRestricted: false,
        activeCount: 0,
        totalRequiredAmount: '0',
        totalFulfilledAmount: '0',
        totalRemainingAmount: '0',
        lastContributedAt: null,
      };
    }

    const totalRequired = sameCurrencyRequirements.reduce(
      (acc, item) => acc.add(item.requiredAmount),
      new Prisma.Decimal(0),
    );

    const totalFulfilled = sameCurrencyRequirements.reduce(
      (acc, item) => acc.add(item.wageredAmount),
      new Prisma.Decimal(0),
    );

    const totalRemaining = totalRequired.sub(totalFulfilled);

    const lastContributedAt =
      activeRequirements
        .map((item) => item.lastContributedAt)
        .filter((date): date is Date => date !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    return {
      currency: targetCurrency,
      isRestricted: true,
      activeCount: sameCurrencyRequirements.length,
      totalRequiredAmount: totalRequired.toString(),
      totalFulfilledAmount: totalFulfilled.toString(),
      totalRemainingAmount: totalRemaining.isNeg()
        ? '0'
        : totalRemaining.toString(),
      lastContributedAt,
    };
  }

  /**
   * 단순 출금 가능 여부만 빠르게 확인 (출금 서비스 등에서 사용)
   */
  async checkWithdrawalEligibility(
    userId: bigint,
  ): Promise<{ isRestricted: boolean }> {
    const activeRequirements = await this.repository.findByUserId(
      userId,
      'ACTIVE',
    );
    return {
      isRestricted: activeRequirements.length > 0,
    };
  }
}
