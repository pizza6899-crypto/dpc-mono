// src/modules/affiliate/commission/application/accumulate-commission.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ExchangeCurrencyCode, GameCategory, Prisma } from '@repo/database';
import { AffiliateCommission } from '../domain';
import { CalculateCommissionService } from './calculate-commission.service';
import { Transactional } from '@nestjs-cls/transactional';

export interface GameRound {
  subUserId: string;
  gameRoundId: bigint;
  wagerAmount: Prisma.Decimal;
  winAmount?: Prisma.Decimal | null;
  currency: ExchangeCurrencyCode;
  gameCategory?: GameCategory | null;
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
  private readonly logger = new Logger(AccumulateCommissionService.name);

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
      try {
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
      } catch (error) {
        // 개별 라운드 처리 실패 시 로깅
        // 트랜잭션 내에서 에러가 발생하면 전체가 롤백되므로,
        // 실제로는 이 블록에 도달하지 않을 수 있음
        this.logger.error(
          `커미션 계산 실패: gameRoundId=${round.gameRoundId}, subUserId=${round.subUserId}`,
          error,
        );
        skippedCount++;
        // 트랜잭션 특성상 에러 발생 시 전체 롤백되므로 throw
        throw error;
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
