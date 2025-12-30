// src/modules/comp/application/comp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ConcurrencyService } from 'src/common/concurrency/concurrency.service';
import { DateTime } from 'luxon';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types/message-codes';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';
import { Prisma } from '@repo/database';

@Injectable()
export class CompService {
  private readonly logger = new Logger(CompService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly concurrencyService: ConcurrencyService,
  ) {}

  /**
   * 콤프 적립 처리 (게임 베팅 시 호출)
   */
  // 'earnComp' 메서드에 날짜 파라미터 추가, 변수명은 earnDate로 함.
  async earnComp(
    userId: bigint,
    contributionAmount: Prisma.Decimal,
    earnDate: Date,
  ) {
    if (contributionAmount.lte(0)) return;

    const userMembership = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        VipMembership: {
          select: {
            vipLevel: {
              select: {
                compRate: true,
              },
            },
          },
        },
      },
    });

    if (!userMembership) {
      return;
    }

    const compRate = userMembership.VipMembership?.vipLevel?.compRate || 0;

    const compAmount = contributionAmount.mul(compRate);

    if (compAmount.lte(0)) return;

    await this.updateDailyCompEarning(
      userId,
      contributionAmount,
      compAmount,
      earnDate,
    );

    return compAmount;
  }

  // earnComp로 오늘 콤프 적립했지만, 해당 게임이 취소나 타이 등 특정 이유로 무효화가 되면,
  // 해당 게임의 comp 포인트 적립을 취소해야함.
  async cancelComp(
    userId: bigint,
    contributionAmount: Prisma.Decimal,
    compAmount: Prisma.Decimal,
    earnDate: Date,
  ) {
    await this.updateDailyCompEarning(
      userId,
      contributionAmount.neg(),
      compAmount.neg(),
      earnDate,
    );
  }

  /**
   * 콤프 수령 처리 (특정 날짜의 베팅 금액 기준)
   */
  async claimComp(userId: bigint, targetDate?: string) {
    return await this.concurrencyService.withUserBalanceLock(
      userId,
      async () => {
        // 동경시 기준으로 현재 시간 계산
        const now = DateTime.now().setZone('Asia/Tokyo');
        let claimDate: Date;

        // targetDate 포맷은 YYYY-MM-DD 형식임.
        if (targetDate) {
          // 날짜가 입력된 경우: 해당 날짜 사용
          claimDate = DateTime.fromISO(targetDate)
            .setZone('Asia/Tokyo')
            .startOf('day')
            .toJSDate();

          // 동경시 05시 기준 검증
          // 해당 날짜의 콤프는 다음날 05시부터 수령 가능
          const nextDay = DateTime.fromJSDate(claimDate)
            .plus({ days: 1 })
            .setZone('Asia/Tokyo');
          const availableTime = nextDay.set({
            hour: 5,
            minute: 0,
            second: 0,
            millisecond: 0,
          });

          if (now < availableTime) {
            throw new ApiException(
              MessageCode.COMP_NOT_AVAILABLE_YET,
              400,
              'Comp for the selected date can be claimed after 5:00 AM Tokyo time.',
            );
          }
        } else {
          // 날짜가 없는 경우: 동경시 기준으로 처리 가능한 날짜 계산
          if (now.hour >= 5) {
            // 05시 이후면 전날 콤프 수령 가능
            claimDate = now.minus({ days: 1 }).startOf('day').toJSDate();
          } else {
            // 05시 이전이면 그 전날 콤프 수령 가능
            claimDate = now.minus({ days: 2 }).startOf('day').toJSDate();
          }
        }

        // 해당 날짜의 콤프 적립 정보 조회
        const dailyCompEarning = await this.prisma.dailyCompEarning.findUnique({
          where: {
            userId_earningDate: {
              userId,
              earningDate: claimDate,
            },
          },
        });

        if (!dailyCompEarning) {
          throw new ApiException(
            MessageCode.COMP_NOT_FOUND,
            404,
            'There is no comp accrued for the selected date.',
          );
        }

        if (dailyCompEarning.isProcessed) {
          throw new ApiException(
            MessageCode.COMP_ALREADY_CLAIMED,
            400,
            'Comp for the selected date has already been claimed.',
          );
        }

        const claimAmount = dailyCompEarning.compEarned;
        if (claimAmount.lte(0)) {
          throw new ApiException(
            MessageCode.COMP_NO_AMOUNT,
            400,
            'There is no comp to claim for the selected date.',
          );
        }

        const userBalance = await this.prisma.userBalance.findUnique({
          where: {
            userId_currency: { userId, currency: WALLET_CURRENCIES[0] },
          },
          select: { bonusBalance: true, mainBalance: true, currency: true },
        });

        if (!userBalance) {
          throw new ApiException(
            MessageCode.USER_NOT_FOUND,
            404,
            'User balance information not found.',
          );
        }

        await this.prisma.$transaction(async (tx) => {
          // 콤프 잔액 증가, 일반 잔액 증가
          const updatedUserBalance = await tx.userBalance.update({
            where: {
              userId_currency: { userId, currency: WALLET_CURRENCIES[0] },
            },
            data: {
              bonusBalance: { increment: claimAmount },
            },
          });

          // 일일 콤프 적립을 처리됨으로 표시
          await tx.dailyCompEarning.update({
            where: { id: dailyCompEarning.id },
            data: { isProcessed: true },
          });

          // 콤프 수령 거래 기록
          await tx.transaction.create({
            data: {
              userId,
              type: 'COMP_CLAIM',
              status: 'COMPLETED',
              currency: userBalance.currency,
              amount: claimAmount,
              beforeAmount: updatedUserBalance.bonusBalance.sub(claimAmount),
              afterAmount: updatedUserBalance.bonusBalance,
              compTransaction: {
                create: {
                  userId,
                  amount: claimAmount,
                  dailyCompEarningId: dailyCompEarning.id,
                },
              },
              balanceDetails: {
                create: {
                  mainBalanceChange: null,
                  mainBeforeAmount: null,
                  mainAfterAmount: null,
                  bonusBalanceChange: claimAmount,
                  bonusBeforeAmount:
                    updatedUserBalance.bonusBalance.sub(claimAmount),
                  bonusAfterAmount: updatedUserBalance.bonusBalance,
                },
              },
            },
          });
        });

        return {
          success: true,
          amount: claimAmount.toNumber(),
          claimDate: targetDate,
        };
      },
    );
  }

  /**
   * 미수령 콤프 내역 조회
   */
  async getUnclaimedComp(userId: bigint) {
    // 동경시 기준으로 현재 시간 계산
    const now = DateTime.now().setZone('Asia/Tokyo');

    // 동경시 05시 기준으로 처리 가능한 날짜 계산
    // 05시 이후면 전날까지, 05시 이전이면 그 전날까지
    let cutoffDate: Date;
    if (now.hour >= 5) {
      // 05시 이후면 오늘 날짜까지 포함 (전날까지)
      cutoffDate = now.startOf('day').toJSDate();
    } else {
      // 05시 이전이면 어제까지만 포함
      cutoffDate = now.minus({ days: 1 }).startOf('day').toJSDate();
    }

    const unclaimedComps = await this.prisma.dailyCompEarning.findMany({
      where: {
        userId,
        isProcessed: false,
        compEarned: {
          gt: 0,
        },
        // 동경시 05시 기준으로 처리 가능한 날짜까지만 조회
        earningDate: {
          lt: cutoffDate,
        },
      },
      orderBy: {
        earningDate: 'desc',
      },
      select: {
        earningDate: true,
        compEarned: true,
      },
    });

    return unclaimedComps.map((comp) => ({
      earningDate: comp.earningDate.toISOString().split('T')[0],
      compEarned: comp.compEarned.toNumber(),
    }));
  }

  /**
   * 일일 콤프 적립 기록 업데이트
   */
  private async updateDailyCompEarning(
    userId: bigint,
    contributionAmount: Prisma.Decimal,
    compAmount: Prisma.Decimal,
    earnDate: Date,
  ): Promise<void> {
    try {
      // 1. UPDATE 시도
      await this.prisma.dailyCompEarning.update({
        where: {
          userId_earningDate: {
            userId,
            earningDate: earnDate,
          },
        },
        data: {
          totalContribution: { increment: contributionAmount },
          compEarned: { increment: compAmount },
        },
      });
      return; // UPDATE 성공하면 종료
    } catch (e) {
      // 2. UPDATE 실패 (레코드 없음) - CREATE 시도
      if (e.code === 'P2025') {
        // P2025: Record not found
        try {
          await this.prisma.dailyCompEarning.create({
            data: {
              userId,
              earningDate: earnDate,
              totalContribution: contributionAmount,
              compEarned: compAmount,
              isProcessed: false,
            },
          });
          return;
        } catch (createError) {
          // 3. CREATE도 실패 (동시 요청으로 인한 Unique Constraint Violation)
          if (createError.code === 'P2002') {
            // 다시 UPDATE 시도
            await this.prisma.dailyCompEarning.updateMany({
              where: {
                userId,
                earningDate: earnDate,
              },
              data: {
                totalContribution: { increment: contributionAmount },
                compEarned: { increment: compAmount },
              },
            });
            return;
          }
          throw createError;
        }
      }
      throw e; // 다른 에러는 그대로 던지기
    }
  }
}
