// src/modules/promotion/campaign/controllers/user/dto/response/promotion.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Language,
  ExchangeCurrencyCode,
  PromotionTargetType,
  PromotionResetType,
} from '@prisma/client';

export class PromotionResponseDto {
  @ApiProperty({
    description: 'Promotion ID (Encoded) / 프로모션 ID (인코딩됨)',
    example: 'p_abc123',
  })
  id: string;

  @ApiProperty({
    description: 'Promotion title (Current language) / 프로모션 제목 (현재 언어)',
    example: '첫 충전 100% 보너스',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Promotion description (Current language) / 프로모션 설명 (현재 언어)',
    example: '첫 충전 시 100% 보너스를 받으세요!',
    nullable: true,
  })
  description?: string | null;


  @ApiPropertyOptional({
    description: 'Minimum deposit amount / 최소 입금 금액',
    example: '10.00',
    type: String,
  })
  minDepositAmount?: string;

  @ApiPropertyOptional({
    description: 'Maximum bonus amount / 최대 보너스 금액',
    example: '1000.00',
    type: String,
    nullable: true,
  })
  maxBonusAmount?: string | null;

  @ApiProperty({
    description: 'Promotion target type / 프로모션 타겟 타입',
    example: PromotionTargetType.FIRST_DEPOSIT,
    enum: PromotionTargetType,
  })
  targetType: PromotionTargetType;


  @ApiProperty({
    description: 'Applicable days (0: Sunday, 1: Monday, ...) / 적용 요일',
    example: [6, 0],
    type: [Number],
  })
  applicableDays: number[];

  @ApiPropertyOptional({
    description: 'Applicable start time / 적용 시작 시간',
    example: '2024-01-01T18:30:00Z',
    nullable: true,
  })
  applicableStartTime: Date | null;

  @ApiPropertyOptional({
    description: 'Applicable end time / 적용 종료 시간',
    example: '2024-01-01T22:00:00Z',
    nullable: true,
  })
  applicableEndTime: Date | null;


  @ApiPropertyOptional({
    description: 'Bonus rate / 보너스 비율',
    example: '1.0',
    type: String,
  })
  bonusRate?: string;

  @ApiPropertyOptional({
    description: 'Wagering multiplier / 웨이저링 배수',
    example: '2.0',
    type: String,
  })
  wageringMultiplier?: string;

  @ApiPropertyOptional({
    description: 'Promotion start date / 프로모션 시작일',
    example: '2024-01-01T00:00:00Z',
    nullable: true,
  })
  startDate: Date | null;

  @ApiPropertyOptional({
    description: 'Promotion end date / 프로모션 종료일',
    example: '2024-12-31T23:59:59Z',
    nullable: true,
  })
  endDate: Date | null;
}

export class ActivePromotionsResponseDto {
  @ApiProperty({
    description: 'List of active promotions / 활성 프로모션 목록',
    type: [PromotionResponseDto],
  })
  promotions: PromotionResponseDto[];
}
