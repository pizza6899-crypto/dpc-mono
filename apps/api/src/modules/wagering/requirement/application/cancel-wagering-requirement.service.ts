import { Inject, Injectable, Logger } from '@nestjs/common';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { WageringPolicy } from '../domain';
import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class CancelWageringRequirementService {
  private readonly logger = new Logger(CancelWageringRequirementService.name);

  constructor(
    @Inject(WAGERING_REQUIREMENT_REPOSITORY)
    private readonly repository: WageringRequirementRepositoryPort,
    private readonly policy: WageringPolicy,
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  /**
   * 유저의 특정 통화 지갑 잔액을 확인하고, 오링(O-ring) 조건 충족 시 롤링 조건을 취소 처리합니다.
   * @param userId 유저 ID
   * @param currency 통화 코드
   * @param currentTotalBalance 현재 총 잔액 (Main + Bonus)
   */
  @Transactional()
  async execute(
    userId: bigint,
    currency: ExchangeCurrencyCode,
    currentTotalBalance: Prisma.Decimal,
  ): Promise<void> {
    const activeRequirements =
      await this.repository.findActiveByUserIdAndCurrency(userId, currency);

    if (activeRequirements.length === 0) {
      return;
    }

    for (const requirement of activeRequirements) {
      // 적용된 설정 스냅샷에서 임계값 추출 (문자열로 저장된 값을 Decimal로 복구)
      const snapshotThreshold = (requirement.appliedConfig as any)?.snapshot
        ?.currencyThreshold;
      const threshold = snapshotThreshold
        ? new Prisma.Decimal(snapshotThreshold)
        : null;

      if (this.policy.canBeCancelled(currentTotalBalance, threshold)) {
        requirement.cancel({
          reason: 'BANKRUPTCY',
          note: `Insufficient balance (O-ring). Current: ${currentTotalBalance}, Threshold: ${threshold}`,
          cancelledBy: 'SYSTEM',
          balanceAtCancellation: currentTotalBalance,
        });
        await this.repository.save(requirement);

        // Explicit Audit Log Dispatch
        await this.dispatchLogService.dispatch({
          type: LogType.ACTIVITY,
          data: {
            userId: userId.toString(),
            category: 'WAGERING',
            action: 'CANCEL_WAGERING_REQUIREMENT',
            metadata: {
              wageringId: requirement.id?.toString(),
              reason: 'O_RING',
              currentTotalBalance: currentTotalBalance.toString(),
              threshold: threshold?.toString(),
            },
          },
        });

        this.logger.log(
          `Wagering requirement ${requirement.id} cancelled due to O-ring logic.`,
        );
      }
    }
  }
}
