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
  /**
   * 특정 게임 라운드에서 생성된 기여 로그 목록을 조회합니다.
   * 취소(Cancel/Refund) 처리 시 롤링 금액을 정확히 회수하기 위해 사용됩니다.
   */
  findByGameRoundId(gameRoundId: bigint): Promise<WageringContributionLog[]>;
}
