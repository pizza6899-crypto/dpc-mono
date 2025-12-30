import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  VipMembershipResponseDto,
  VipHistoryResponseDto,
} from '../dtos/vip-membership.dto';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import { nowUtc } from 'src/utils/date.util';
import { Prisma } from '@repo/database';

@Injectable()
export class VipMembershipService {
  private readonly logger = new Logger(VipMembershipService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사용자 VIP 멤버십 조회/생성
   */
  async getOrCreateMembership(userId: bigint) {
    let membership = await this.prisma.vipMembership.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        accumulatedRolling: true,
        achievedAt: true,
        vipLevel: {
          select: {
            id: true,
            rank: true,
            nameKey: true,
            compRate: true,
          },
        },
      },
    });

    if (!membership) {
      const defaultLevel = await this.prisma.vipLevel.findFirst({
        where: { rank: 0 },
        select: {
          id: true,
        },
      });

      if (!defaultLevel) {
        throw new ApiException(
          MessageCode.VIP_LEVEL_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Default VIP level not found.',
        );
      }

      membership = await this.prisma.vipMembership.create({
        data: {
          userId,
          vipLevelId: defaultLevel.id,
          accumulatedRolling: 0,
          totalRewardsPaid: 0,
          achievedAt: nowUtc(),
        },
        select: {
          id: true,
          userId: true,
          accumulatedRolling: true,
          achievedAt: true,
          vipLevel: {
            select: {
              id: true,
              rank: true,
              nameKey: true,
              compRate: true,
              paybackBasisRate: true,
              weeklyBonusRate: true,
              monthlyBonusRate: true,
            },
          },
        },
      });
    }

    return membership;
  }

  /**
   * 사용자 VIP 정보 조회
   */
  async getUserVipInfo(userId: bigint): Promise<VipMembershipResponseDto> {
    const membership = await this.getOrCreateMembership(userId);
    const nextLevel = await this.prisma.vipLevel.findFirst({
      where: {
        rank: {
          gt: membership.vipLevel.rank,
        },
      },
      orderBy: { rank: 'asc' },
      select: {
        nameKey: true,
        rank: true,
        requiredRolling: true,
      },
    });

    return {
      userId: membership.userId,
      currentLevel: {
        nameKey: membership.vipLevel.nameKey,
        rank: membership.vipLevel.rank,
      },
      accumulatedRolling: membership.accumulatedRolling.toNumber(),
      achievedAt: membership.achievedAt,
      nextLevelRequiredRolling: nextLevel
        ? nextLevel.requiredRolling.toNumber() -
          membership.accumulatedRolling.toNumber()
        : 0,
      nextLevel: nextLevel
        ? {
            nameKey: nextLevel.nameKey,
            rank: nextLevel.rank,
          }
        : undefined,
    };
  }

  /**
   * VIP 레벨 자동 업데이트 (롤링 금액 기반, 단계별 처리)
   */
  async updateVipLevel(userId: bigint) {
    const membership = await this.getOrCreateMembership(userId);

    // 현재 롤링 금액으로 달성 가능한 모든 레벨 찾기 (순서대로)
    const eligibleLevels = await this.prisma.vipLevel.findMany({
      where: {
        requiredRolling: {
          lte: membership.accumulatedRolling,
        },
        rank: {
          gt: membership.vipLevel.rank,
        },
      },
      orderBy: { rank: 'asc' }, // 낮은 레벨부터 순서대로
      select: {
        id: true,
        nameKey: true,
        rank: true,
        levelUpBonus: true,
      },
    });

    // 업그레이드 가능한 레벨이 없으면 종료
    if (eligibleLevels.length === 0) {
      return;
    }

    // 단계별로 레벨업 처리 (모든 중간 레벨의 보상 지급)
    for (const newLevel of eligibleLevels) {
      // 멤버십 업데이트
      await this.prisma.vipMembership.update({
        where: { id: membership.id },
        data: {
          vipLevelId: newLevel.id,
          achievedAt: nowUtc(),
        },
      });

      // 히스토리 생성 (각 레벨업마다)
      await this.prisma.vipHistory.create({
        data: {
          userId,
          previousLevelNameKey: membership.vipLevel.nameKey,
          newLevelNameKey: newLevel.nameKey,
          rewardAmount: newLevel.levelUpBonus,
          vipMembershipId: membership.id,
        },
      });

      // 다음 레벨업을 위해 현재 레벨 정보 업데이트
      membership.vipLevel = {
        nameKey: newLevel.nameKey,
        rank: newLevel.rank,
      } as any;
    }
  }

  async addRolling(userId: bigint, rollingAmount: Prisma.Decimal) {
    if (rollingAmount.lte(0)) return;

    const updatedMembership = await this.prisma.vipMembership.update({
      where: { userId },
      data: {
        accumulatedRolling: {
          increment: rollingAmount,
        },
      },
      select: {
        accumulatedRolling: true,
      },
    });

    return updatedMembership.accumulatedRolling;
  }

  async cancelRolling(userId: bigint, rollingAmount: Prisma.Decimal) {
    if (rollingAmount.lte(0)) return;

    const updatedMembership = await this.prisma.vipMembership.update({
      where: { userId },
      data: {
        accumulatedRolling: {
          increment: rollingAmount.neg(),
        },
      },
      select: {
        accumulatedRolling: true,
      },
    });

    return updatedMembership.accumulatedRolling;
  }
}
