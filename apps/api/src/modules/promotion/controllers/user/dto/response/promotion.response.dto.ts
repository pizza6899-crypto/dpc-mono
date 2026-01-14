// src/modules/promotion/controllers/user/dto/response/promotion.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PromotionResponseDto {
  @ApiPropertyOptional({
    description: '프로모션 코드',
    example: 'WELCOME_BONUS',
    nullable: true,
  })
  code?: string | null;

  @ApiProperty({
    description: '프로모션 이름 (현재 언어)',
    example: '첫 충전 100% 보너스',
  })
  name: string;

  @ApiPropertyOptional({
    description: '프로모션 설명 (현재 언어)',
    example: '첫 충전 시 100% 보너스를 받으세요!',
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: '언어 코드',
    example: 'KO',
  })
  language?: string;

  @ApiPropertyOptional({
    description: '통화 코드',
    example: 'USDT',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: '최소 입금 금액',
    example: '10.00',
    type: String,
  })
  minDepositAmount?: string;

  @ApiPropertyOptional({
    description: '최대 보너스 금액',
    example: '1000.00',
    type: String,
    nullable: true,
  })
  maxBonusAmount?: string | null;

  @ApiProperty({
    description: '프로모션 타겟 타입',
    example: 'NEW_USER_FIRST_DEPOSIT',
  })
  targetType: string;

  @ApiProperty({
    description: '보너스 타입',
    example: 'PERCENTAGE',
  })
  bonusType: string;

  @ApiPropertyOptional({
    description: '보너스 비율 (PERCENTAGE 타입인 경우)',
    example: '1.0',
    type: String,
  })
  bonusRate?: string;

  @ApiPropertyOptional({
    description: '롤링 배수',
    example: '20.0',
    type: String,
  })
  rollingMultiplier?: string;

  @ApiProperty({
    description: '1회성 프로모션 여부',
    example: true,
  })
  isOneTime: boolean;

  @ApiPropertyOptional({
    description: '프로모션 시작일',
    example: '2024-01-01T00:00:00Z',
    nullable: true,
  })
  startDate: Date | null;

  @ApiPropertyOptional({
    description: '프로모션 종료일',
    example: '2024-12-31T23:59:59Z',
    nullable: true,
  })
  endDate: Date | null;
}

export class ActivePromotionsResponseDto {
  @ApiProperty({
    description: '활성 프로모션 목록',
    type: [PromotionResponseDto],
  })
  promotions: PromotionResponseDto[];
}
