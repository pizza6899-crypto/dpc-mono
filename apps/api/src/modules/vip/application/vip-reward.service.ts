import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ConcurrencyService } from 'src/common/concurrency/concurrency.service';
import { TransactionType, TransactionStatus } from '@repo/database';
import { nowUtc } from 'src/utils/date.util';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';
import { Prisma } from '@repo/database';

// VIP 레벨 타입 정의
interface VipLevelForReward {
  levelUpBonus: Prisma.Decimal;
  nameKey: string;
  compRate: Prisma.Decimal;
}

@Injectable()
export class VipRewardService {
  private readonly logger = new Logger(VipRewardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly concurrencyService: ConcurrencyService,
  ) {}

  /**
   * 레벨업 보너스 지급
   */
  async processLevelUpBonus(
    userId: bigint,
    newLevel: VipLevelForReward,
  ): Promise<void> {
    if (newLevel.levelUpBonus.lte(0)) {
      return;
    }

    return await this.concurrencyService.withUserBalanceLock(
      userId,
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            balances: {
              where: {
                currency: WALLET_CURRENCIES[0],
              },
              select: {
                mainBalance: true,
              },
            }[0],
          },
        });

        if (!user || !user.balances[0]) {
          throw new Error('사용자 또는 잔액 정보를 찾을 수 없습니다.');
        }

        const beforeAmount = user.balances[0].mainBalance;
        const afterAmount = beforeAmount.add(newLevel.levelUpBonus);

        await this.prisma.$transaction(async (tx) => {
          // 잔액 업데이트
          await tx.userBalance.update({
            where: {
              userId_currency: { userId: userId, currency: user.currency! },
            },
            data: {
              mainBalance: afterAmount,
            },
          });

          // 트랜잭션 생성
          await tx.transaction.create({
            data: {
              userId,
              type: TransactionType.BONUS,
              status: TransactionStatus.COMPLETED,
              currency: user.personalBalance!.currency,
              amount: newLevel.levelUpBonus,
              beforeAmount,
              afterAmount,
            },
          });

          // VIP 히스토리 업데이트 (지급 완료)
          const vipHistory = await tx.vipHistory.updateMany({
            where: {
              userId,
              newLevelNameKey: newLevel.nameKey,
              rewardPaid: false,
            },
            data: {
              rewardPaid: true,
              paidAt: nowUtc(),
            },
          });

          // 멤버십 총 보상 업데이트
          await tx.vipMembership.update({
            where: { userId },
            data: {
              totalRewardsPaid: { increment: newLevel.levelUpBonus },
            },
          });

          // 레퍼럴 보너스 적립
          // if (vipHistory) {
          //   await this.referralBonusService.earnBonusFromVipLevelUp(
          //     tx,
          //     userId,
          //     vipHistory.id,
          //     newLevel.levelUpBonus,
          //     user.personalBalance!.currency,
          //   );
          // }
        });

        this.logger.log(
          `레벨업 보너스 지급 완료: userId=${userId}, amount=${newLevel.levelUpBonus.toNumber()}`,
        );
      },
    );
  }
}
