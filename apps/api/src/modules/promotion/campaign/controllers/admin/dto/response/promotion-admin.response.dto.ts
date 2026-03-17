// src/modules/promotion/campaign/controllers/admin/dto/response/promotion-admin.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionStatisticsResponseDto } from './promotion-statistics.response.dto';

export class PromotionCurrencyRuleResponseDto {
  @ApiProperty({ description: 'ID / ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Promotion ID / 프로모션 ID', example: '1' })
  promotionId: string;

  @ApiProperty({ description: 'Currency code / 통화 코드', example: 'USDT' })
  currency: string;

  @ApiProperty({ description: 'Minimum deposit amount / 최소 입금 금액', example: '10.00' })
  minDepositAmount: string;

  @ApiPropertyOptional({
    description: 'Maximum recognized deposit amount / 최대 입금 인정 금액',
    example: '1000.00',
    nullable: true,
  })
  maxDepositAmount: string | null;

  @ApiPropertyOptional({
    description: 'Maximum bonus amount / 최대 보너스 금액',
    example: '100.00',
    nullable: true,
  })
  maxBonusAmount: string | null;

  @ApiPropertyOptional({
    description: 'Maximum withdrawal amount / 최대 출금 금액',
    example: '500.00',
    nullable: true,
  })
  maxWithdrawAmount: string | null;

  @ApiPropertyOptional({
    description: 'Bonus rate / 보너스 비율',
    example: '1.0',
    nullable: true,
  })
  bonusRate: string | null;

  @ApiPropertyOptional({
    description: 'Wagering multiplier / 웨이저링 배수',
    example: '20.0',
    nullable: true,
  })
  wageringMultiplier: string | null;

  @ApiProperty({ description: 'Created at / 생성일시' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at / 수정일시' })
  updatedAt: Date;
}

export class PromotionTranslationResponseDto {
  @ApiProperty({ description: 'ID / ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Promotion ID / 프로모션 ID', example: '1' })
  promotionId: string;

  @ApiProperty({ description: 'Language code / 언어 코드', example: 'EN' })
  language: string;

  @ApiProperty({ description: 'Promotion title / 프로모션 제목', example: 'Welcome Bonus' })
  title: string;

  @ApiPropertyOptional({
    description: 'Promotion description / 프로모션 설명',
    example: 'Get 100% bonus',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ description: 'Created at / 생성일시' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at / 수정일시' })
  updatedAt: Date;
}

export class PromotionAdminResponseDto {
  @ApiProperty({
    description: 'Promotion ID / 프로모션 ID',
    example: '1',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Whether the promotion is active / 활성화 여부',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Promotion target type / 프로모션 타겟 타입',
    example: 'FIRST_DEPOSIT',
  })
  targetType: string;


  @ApiPropertyOptional({
    description: 'Bonus expiry minutes / 보너스 만료 분',
    example: 1440,
    type: Number,
    nullable: true,
  })
  bonusExpiryMinutes: number | null;

  @ApiPropertyOptional({
    description: 'Maximum usage count per user / 유저당 최대 사용 횟수',
    example: 1,
    type: Number,
    nullable: true,
  })
  maxUsagePerUser: number | null;

  @ApiProperty({
    description: 'Periodic reset type / 참여 횟수 초기화 주기',
    example: 'NONE',
  })
  periodicResetType: string;

  @ApiProperty({
    description:
      'Applicable days (0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat) / 적용 요일 (0: 일, 1: 월, 2: 화, 3: 수, 4: 목, 5: 금, 6: 토)',
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

  @ApiProperty({
    description: 'Created at / 생성일시',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at / 수정일시',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Promotion statistics / 프로모션 통계',
    type: PromotionStatisticsResponseDto,
  })
  statistics?: PromotionStatisticsResponseDto;

  @ApiProperty({
    description: 'Currency rules list / 통화별 규칙 목록',
    type: [PromotionCurrencyRuleResponseDto],
  })
  currencyRules: PromotionCurrencyRuleResponseDto[];

  @ApiProperty({
    description: 'Translation info list / 번역 정보 목록',
    type: [PromotionTranslationResponseDto],
  })
  translations: PromotionTranslationResponseDto[];
}
