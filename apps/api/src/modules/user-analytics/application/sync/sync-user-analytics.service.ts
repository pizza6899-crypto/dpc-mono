import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  USER_ANALYTICS_REPOSITORY,
  type UserAnalyticsRepositoryPort,
  UpdateUserAnalyticsDto,
} from '../../ports/out/user-analytics.repository.port';
import { Prisma, UserWalletTransactionType } from '@prisma/client';

export interface SyncAnalyticsCommand {
  userId: bigint;
  type: UserWalletTransactionType;
  amountUsd: Prisma.Decimal;
  timestamp: Date;
}

@Injectable()
export class SyncUserAnalyticsService {
  private readonly logger = new Logger(SyncUserAnalyticsService.name);

  constructor(
    @Inject(USER_ANALYTICS_REPOSITORY)
    private readonly repository: UserAnalyticsRepositoryPort,
  ) {}

  /**
   * 트랜잭션 데이터를 기반으로 전역 통계를 동기화합니다.
   */
  async sync(command: SyncAnalyticsCommand): Promise<void> {
    const { userId, type, amountUsd, timestamp } = command;

    // 금액이 0이면 업데이트 불필요
    if (amountUsd.isZero()) return;

    const dto: UpdateUserAnalyticsDto = {
      userId,
      date: timestamp,
    };

    // 트랜잭션 타입에 따라 매핑
    switch (type) {
      case UserWalletTransactionType.DEPOSIT:
        dto.depositUsd = amountUsd;
        break;
      case UserWalletTransactionType.WITHDRAW:
        dto.withdrawUsd = amountUsd.abs(); // 출금은 항상 양수 누적으로 처리 (UpdateUserAnalyticsDto에서 음수로 처리할지 양수로 처리할지는 레포지토리에 맡겼음)
        // 레포지토리 로직 확인: ltv_usd = D - W 이므로 wUsd는 양수로 전달되어야 함.
        break;
      case UserWalletTransactionType.BET:
        dto.betUsd = amountUsd.abs();
        break;
      case UserWalletTransactionType.WIN:
        dto.winUsd = amountUsd.abs();
        break;
      case UserWalletTransactionType.BONUS_IN:
      case UserWalletTransactionType.BONUS_CONVERSION:
      case UserWalletTransactionType.COMP_CLAIM:
        // 프로모션 비용 (NGR 차감 요소)
        dto.promoUsd = amountUsd.abs();
        break;
      case UserWalletTransactionType.REFUND:
        // 환불은 베팅의 정반대 (Bet 차감)
        dto.betUsd = amountUsd.neg(); // 베팅액을 줄임
        break;
      default:
        // 다른 타입들은 통계에 직접적인 영향이 없거나 이미 위 분류에 포함됨
        return;
    }

    try {
      await this.repository.increaseStats(dto);
    } catch (error) {
      this.logger.error(
        `Failed to sync analytics for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
