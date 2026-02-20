import type { WageringContributionLog } from '../domain';
import type { Prisma } from '@prisma/client';

export interface WageringContributionLogRepositoryPort {
  /**
   * 특정 롤링 조건에 대한 기여 로그를 생성합니다.
   */
  create(data: {
    wageringRequirementId: bigint;
    gameRoundId: bigint;
    requestAmount: Prisma.Decimal;
    contributionRate: Prisma.Decimal;
    wageredAmount: Prisma.Decimal;
  }): Promise<void>;

  /**
   * 특정 롤링 조건의 기여 로그 목록을 조회합니다.
   */
  findByRequirementId(
    wageringRequirementId: bigint,
  ): Promise<WageringContributionLog[]>;
}

export const WAGERING_CONTRIBUTION_LOG_REPOSITORY = Symbol(
  'WAGERING_CONTRIBUTION_LOG_REPOSITORY',
);
