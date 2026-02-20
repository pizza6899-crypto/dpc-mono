import { Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { AffiliateCommission } from '../domain';
import { CalculateCommissionService } from './calculate-commission.service';
import { Transactional } from '@nestjs-cls/transactional';

export interface GameRound {
  subUserId: bigint;
  gameRoundId: bigint;
  wagerAmount: Prisma.Decimal;
  winAmount?: Prisma.Decimal | null;
  currency: ExchangeCurrencyCode;
  gameCategory?: string | null;
}

interface AccumulateCommissionParams {
  rounds: GameRound[];
}

export interface AccumulateCommissionResult {
  commissions: AffiliateCommission[];
  statistics: {
    total: number;
    processed: number;
    skipped: number;
  };
}

@Injectable()
export class AccumulateCommissionService {
  constructor(
    private readonly calculateCommissionService: CalculateCommissionService,
  ) {}

  @Transactional()
  async execute({
    rounds,
  }: AccumulateCommissionParams): Promise<AccumulateCommissionResult> {
    // 빈 배열 조기 반환
    if (rounds.length === 0) {
      return {
        commissions: [],
        statistics: { total: 0, processed: 0, skipped: 0 },
      };
    }

    const commissions: AffiliateCommission[] = [];
    let processedCount = 0;
    let skippedCount = 0;

    // 각 라운드를 순차적으로 처리
    // 순차 처리는 트랜잭션 안전성과 데이터 일관성을 보장하기 위해 필요
    for (const round of rounds) {
      const commission = await this.calculateCommissionService.execute({
        subUserId: round.subUserId,
        gameRoundId: round.gameRoundId,
        wagerAmount: round.wagerAmount,
        winAmount: round.winAmount,
        currency: round.currency,
        gameCategory: round.gameCategory,
      });

      // null이 아닌 경우만 추가 (레퍼럴 관계가 없거나 중복인 경우 null)
      if (commission) {
        commissions.push(commission);
        processedCount++;
      } else {
        skippedCount++;
      }
    }

    const statistics = {
      total: rounds.length,
      processed: processedCount,
      skipped: skippedCount,
    };

    // 통계 정보를 반환값에 포함하여 호출자가 필요시 로깅/모니터링 가능
    return {
      commissions,
      statistics,
    };
  }
}
