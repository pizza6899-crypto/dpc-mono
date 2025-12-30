import { Injectable, Logger } from '@nestjs/common';
import { RollingService } from 'src/modules/rolling/application/rolling.service';
import { Prisma } from '@repo/database';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types/message-codes';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class PromotionBonusService {
  private readonly logger = new Logger(PromotionBonusService.name);

  constructor(private readonly rollingService: RollingService) {}

  /**
   * 프로모션 보너스 지급
   * @param tx 트랜잭션 클라이언트
   * @param userId 사용자 ID
   * @param promotionId 프로모션 ID
   * @param depositAmount 입금 금액
   * @param depositDetailId 입금 상세 ID
   */
  async grantPromotionBonus(
    tx: Prisma.TransactionClient,
    userId: bigint,
    promotionId: number,
    depositAmount: Prisma.Decimal,
    depositDetailId: bigint,
  ): Promise<{
    userPromotion: any;
    bonusAmount: Prisma.Decimal;
    rollingCreated: boolean;
  }> {
    // 프로모션 조회
    const promotion = await tx.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new ApiException(
        MessageCode.PROMOTION_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
        'Promotion not found',
      );
    }

    // 보너스 금액 계산
    let bonusAmount = new Prisma.Decimal(0);
    if (promotion.bonusType === 'PERCENTAGE' && promotion.bonusRate) {
      bonusAmount = depositAmount.mul(promotion.bonusRate);
    }

    // 최대 보너스 제한 적용
    if (promotion.maxBonusAmount && bonusAmount.gt(promotion.maxBonusAmount)) {
      bonusAmount = promotion.maxBonusAmount;
    }

    // UserPromotion 생성
    const userPromotion = await tx.userPromotion.create({
      data: {
        userId,
        promotionId,
        status: 'ACTIVE',
        bonusGranted: true,
        bonusGrantedAt: new Date(),
        bonusAmount,
      },
    });

    // 롤링 생성 (롤링 배수가 있는 경우)
    let rollingCreated = false;
    if (promotion.rollingMultiplier && bonusAmount.gt(0)) {
      const totalAmount = depositAmount.add(bonusAmount);
      const requiredRolling = totalAmount.mul(promotion.rollingMultiplier);

      await this.rollingService.createPromotionRolling(
        tx,
        userId,
        bonusAmount,
        userPromotion.id,
        promotion.rollingMultiplier,
        bonusAmount, // 소멸 임계값 = 보너스 금액
      );

      rollingCreated = true;
    }

    this.logger.log(
      `프로모션 보너스 지급: userId=${userId}, promotionId=${promotionId}, bonusAmount=${bonusAmount}`,
    );

    return {
      userPromotion,
      bonusAmount,
      rollingCreated,
    };
  }
}
