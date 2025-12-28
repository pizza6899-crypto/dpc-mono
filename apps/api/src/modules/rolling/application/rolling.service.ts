// src/modules/rolling/application/rolling.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { ConcurrencyService } from 'src/platform/concurrency/concurrency.service';
import { Prisma, RollingSourceType, RollingStatus } from '@repo/database';

@Injectable()
export class RollingService {
  private readonly logger = new Logger(RollingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly concurrencyService: ConcurrencyService,
  ) {}

  /**
   * 입금 시 롤링 생성
   * @param userId 사용자 ID
   * @param depositAmount 입금 금액
   * @param depositDetailId 입금 상세 ID
   * @param rollingMultiplier 롤링 배수 (기본 1.0 = 100%)
   * @param cancellationThreshold 소멸 임계값 (기본 입금액)
   */
  async createDepositRolling(
    tx: Prisma.TransactionClient,
    userId: string,
    depositAmount: Prisma.Decimal,
    depositDetailId: bigint,
    rollingMultiplier: Prisma.Decimal = new Prisma.Decimal(1.0),
    cancellationThreshold?: Prisma.Decimal,
  ) {
    const requiredAmount = depositAmount.mul(rollingMultiplier);
    const threshold =
      cancellationThreshold ?? depositAmount.mul(new Prisma.Decimal(0.1)); // 기본 10% 이하 시 소멸

    const rolling = await tx.rolling.create({
      data: {
        userId,
        sourceType: RollingSourceType.DEPOSIT,
        depositDetailId: depositDetailId,
        requiredAmount,
        currentAmount: new Prisma.Decimal(0),
        depositAmount,
        cancellationBalanceThreshold: threshold,
        status: RollingStatus.ACTIVE,
      },
    });

    this.logger.log(
      `롤링 생성: userId=${userId}, depositId=${depositDetailId}, required=${requiredAmount}`,
    );

    return rolling;
  }

  /**
   * 프로모션 보너스 롤링 생성 (나중에 구현)
   */
  async createPromotionRolling(
    tx: Prisma.TransactionClient,
    userId: string,
    bonusAmount: Prisma.Decimal,
    userPromotionId: number,
    rollingMultiplier: Prisma.Decimal,
    cancellationThreshold?: Prisma.Decimal,
  ) {
    const requiredAmount = bonusAmount.mul(rollingMultiplier);
    const threshold = cancellationThreshold ?? bonusAmount;

    return await tx.rolling.create({
      data: {
        userId,
        sourceType: RollingSourceType.PROMOTION_BONUS,
        userPromotionId,
        bonusAmount,
        requiredAmount,
        currentAmount: new Prisma.Decimal(0),
        cancellationBalanceThreshold: threshold,
        status: RollingStatus.ACTIVE,
      },
    });
  }

  /**
   * 베팅 시 롤링 처리 (FIFO 순서)
   * @param userId 사용자 ID
   * @param rollingAmount 롤링 증가량 (베팅 금액)
   * @param userBalance 현재 유저 잔액 (조건부 소멸 체크용)
   */
  async processRolling(
    userId: string,
    rollingAmount: Prisma.Decimal,
    userBalance: Prisma.Decimal,
  ) {
    return await this.concurrencyService.withUserBalanceLock(
      userId,
      async () => {
        return await this.prisma.$transaction(async (tx) => {
          // FIFO 순서로 활성 롤링 조회
          const activeRollings = await tx.rolling.findMany({
            where: {
              userId,
              status: RollingStatus.ACTIVE,
            },
            orderBy: {
              createdAt: 'asc', // 가장 오래된 것부터
            },
          });

          if (activeRollings.length === 0) {
            return { processedRollings: [], cancelledRollings: [] };
          }

          const processedRollings: any[] = [];
          const cancelledRollings: any[] = [];
          let remainingAmount = rollingAmount;

          // 각 롤링을 순차적으로 처리
          for (const rolling of activeRollings) {
            if (remainingAmount.lte(0)) break;

            // 조건부 소멸 체크
            if (
              rolling.cancellationBalanceThreshold &&
              userBalance.lte(rolling.cancellationBalanceThreshold)
            ) {
              // 롤링 소멸
              const cancelled = await tx.rolling.update({
                where: { id: rolling.id },
                data: {
                  status: RollingStatus.CANCELLED,
                  cancelledAt: new Date(),
                },
              });
              cancelledRollings.push(cancelled);
              continue;
            }

            // 롤링 진행
            const neededAmount = rolling.requiredAmount.sub(
              rolling.currentAmount,
            );
            const appliedAmount = Prisma.Decimal.min(
              neededAmount,
              remainingAmount,
            );
            const newCurrentAmount = rolling.currentAmount.add(appliedAmount);
            remainingAmount = remainingAmount.sub(appliedAmount);

            const updateData: Prisma.RollingUpdateInput = {
              currentAmount: newCurrentAmount,
            };

            // 롤링 완료 체크
            if (newCurrentAmount.gte(rolling.requiredAmount)) {
              updateData.status = RollingStatus.COMPLETED;
              updateData.completedAt = new Date();
            }

            const updated = await tx.rolling.update({
              where: { id: rolling.id },
              data: updateData,
            });

            processedRollings.push(updated);
          }

          return { processedRollings, cancelledRollings };
        });
      },
    );
  }

  /**
   * 사용자의 활성 롤링 조회
   */
  async getActiveRollings(userId: string) {
    return await this.prisma.rolling.findMany({
      where: {
        userId,
        status: RollingStatus.ACTIVE,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * 사용자의 모든 롤링 조회
   */
  async getUserRollings(userId: string, status?: RollingStatus) {
    return await this.prisma.rolling.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 출금 가능 여부 체크 (모든 활성 롤링이 완료되어야 함)
   */
  async canWithdraw(userId: string): Promise<boolean> {
    const activeRollings = await this.getActiveRollings(userId);
    return activeRollings.length === 0;
  }

  /**
   * 롤링 요약 정보 조회
   */
  async getRollingSummary(userId: string) {
    const activeRollings = await this.getActiveRollings(userId);

    const totalRequired = activeRollings.reduce(
      (sum, r) => sum.add(r.requiredAmount),
      new Prisma.Decimal(0),
    );
    const totalCurrent = activeRollings.reduce(
      (sum, r) => sum.add(r.currentAmount),
      new Prisma.Decimal(0),
    );

    // RollingResponseDto 형식으로 변환
    const rollingDtos = activeRollings.map((rolling) => {
      const progressPercentage = rolling.requiredAmount.gt(0)
        ? rolling.currentAmount.div(rolling.requiredAmount).mul(100).toNumber()
        : 100;

      return {
        id: rolling.id.toString(),
        sourceType: rolling.sourceType,
        requiredAmount: rolling.requiredAmount.toString(),
        currentAmount: rolling.currentAmount.toString(),
        progressPercentage,
        status: rolling.status,
        completedAt: rolling.completedAt,
        cancelledAt: rolling.cancelledAt,
        createdAt: rolling.createdAt,
      };
    });

    return {
      activeRollings: rollingDtos,
      totalRequiredAmount: totalRequired.toString(),
      totalCurrentAmount: totalCurrent.toString(),
      canWithdraw: activeRollings.length === 0,
    };
  }
}
