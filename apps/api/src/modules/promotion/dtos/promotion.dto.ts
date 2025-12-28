import { ApiProperty } from '@nestjs/swagger';
import {
  PromotionTargetType,
  PromotionBonusType,
  PromotionQualificationCondition,
} from '@repo/database';

export class PromotionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: PromotionBonusType })
  bonusType: PromotionBonusType;

  @ApiProperty({ nullable: true })
  bonusRate: number | null;

  @ApiProperty()
  minDepositAmount: string;

  @ApiProperty({ nullable: true })
  maxBonusAmount: string | null;

  @ApiProperty({ nullable: true })
  rollingMultiplier: number | null;

  @ApiProperty({ enum: PromotionTargetType })
  targetType: PromotionTargetType;

  @ApiProperty({ nullable: true })
  startDate: Date | null;

  @ApiProperty({ nullable: true })
  endDate: Date | null;
}

export class UserPromotionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  promotionId: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  bonusGranted: boolean;

  @ApiProperty({ nullable: true })
  bonusAmount: string | null;

  @ApiProperty({ nullable: true })
  bonusGrantedAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class PromotionApplicationCheckDto {
  @ApiProperty()
  canApply: boolean;

  @ApiProperty({ nullable: true })
  reason?: string;
}
