import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { Prisma, PromotionTargetType } from '@repo/database';
import { UserPromotionResponseDto } from '../dtos/promotion.dto';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types/message-codes';
import { HttpStatus } from '@nestjs/common';
import { toLanguageEnum } from 'src/utils/language.util';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 활성 프로모션 조회 (사용자용)
   * @param userId 사용자 ID
   * @param language 언어 코드
   */
  async getActivePromotions(
    userId: string,
    language: string = 'ko',
  ): Promise<any[]> {
    const now = new Date();

    const promotions = await this.prisma.promotion.findMany({
      where: {
        isActive: true,
        AND: [
          {
            // startDate가 null이거나 현재 시간 이전
            OR: [{ startDate: null }, { startDate: { lte: now } }],
          },
          {
            // endDate가 null이거나 현재 시간 이후
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
        ],
      },
      include: {
        translations: {
          where: { language: toLanguageEnum(language) },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return promotions.map((promo) => ({
      id: promo.id,
      name: promo.translations[0]?.name || promo.managementName,
      description: promo.translations[0]?.description,
      bonusType: promo.bonusType,
      bonusRate: promo.bonusRate?.toNumber(),
      minDepositAmount: promo.minDepositAmount.toString(),
      maxBonusAmount: promo.maxBonusAmount?.toString(),
      rollingMultiplier: promo.rollingMultiplier?.toNumber(),
      targetType: promo.targetType,
    }));
  }

  /**
   * 프로모션 상세 조회
   */
  async getPromotionById(id: number, language: string): Promise<any> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        translations: {
          where: { language: toLanguageEnum(language) },
        },
      },
    });

    if (!promotion) {
      throw new ApiException(
        MessageCode.PROMOTION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Promotion not found',
      );
    }

    return {
      id: promotion.id,
      managementName: promotion.managementName,
      name: promotion.translations[0]?.name || promotion.managementName,
      description: promotion.translations[0]?.description,
      isActive: promotion.isActive,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      targetType: promotion.targetType,
      bonusType: promotion.bonusType,
      bonusRate: promotion.bonusRate?.toNumber(),
      minDepositAmount: promotion.minDepositAmount.toString(),
      maxBonusAmount: promotion.maxBonusAmount?.toString(),
      rollingMultiplier: promotion.rollingMultiplier?.toNumber(),
      qualificationMaintainCondition: promotion.qualificationMaintainCondition,
    };
  }

  /**
   * 프로모션 적용 가능 여부 체크
   */
  async canApplyPromotion(
    userId: string,
    promotionId: number,
    depositAmount: Prisma.Decimal,
  ): Promise<{ canApply: boolean; reason?: string }> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      return { canApply: false, reason: '프로모션을 찾을 수 없습니다.' };
    }

    // 활성화 체크
    if (!promotion.isActive) {
      return { canApply: false, reason: '비활성화된 프로모션입니다.' };
    }

    // 기간 체크 (null이면 기간 제한 없음)
    const now = new Date();
    if (promotion.startDate && now < promotion.startDate) {
      return { canApply: false, reason: '프로모션 기간이 아닙니다.' };
    }
    if (promotion.endDate && now > promotion.endDate) {
      return { canApply: false, reason: '프로모션 기간이 아닙니다.' };
    }

    // 최소 입금 금액 체크
    if (depositAmount.lt(promotion.minDepositAmount)) {
      return {
        canApply: false,
        reason: `최소 입금 금액은 ${promotion.minDepositAmount}입니다.`,
      };
    }

    // 대상 조건 체크
    if (promotion.targetType === PromotionTargetType.NEW_USER_FIRST_DEPOSIT) {
      // 첫 충전 여부 체크
      const existingDeposit = await this.prisma.transaction.findFirst({
        where: {
          userId,
          type: 'DEPOSIT',
          status: 'COMPLETED',
        },
      });

      if (existingDeposit) {
        return {
          canApply: false,
          reason:
            '이미 입금 이력이 있어 첫 충전 프로모션을 사용할 수 없습니다.',
        };
      }
    }

    // 이미 해당 프로모션을 사용했는지 체크
    const existingUserPromotion = await this.prisma.userPromotion.findFirst({
      where: {
        userId,
        promotionId,
        status: { in: ['ACTIVE', 'QUALIFICATION_LOST'] },
      },
    });

    if (existingUserPromotion) {
      return {
        canApply: false,
        reason: '이미 사용한 프로모션입니다.',
      };
    }

    return { canApply: true };
  }

  /**
   * 사용자의 프로모션 이력 조회
   */
  async getUserPromotions(userId: string): Promise<UserPromotionResponseDto[]> {
    const userPromotions = await this.prisma.userPromotion.findMany({
      where: { userId },
      include: {
        promotion: {
          include: {
            translations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return userPromotions.map((up) => ({
      id: up.id,
      promotionId: up.promotionId,
      status: up.status,
      bonusGranted: up.bonusGranted,
      bonusAmount: up.bonusAmount?.toString() ?? null,
      bonusGrantedAt: up.bonusGrantedAt,
      createdAt: up.createdAt,
    }));
  }
}
