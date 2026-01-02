// src/modules/promotion/controllers/user/dto/response/user-promotion.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPromotionResponseDto {
  @ApiProperty({
    description: '사용자 프로모션 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '프로모션 ID',
    example: 1,
  })
  promotionId: number;

  @ApiProperty({
    description: '프로모션 상태',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: '보너스 지급 여부',
    example: true,
  })
  bonusGranted: boolean;

  @ApiProperty({
    description: '입금 금액 (스냅샷)',
    example: '100.00',
    type: String,
  })
  depositAmount: string;

  @ApiProperty({
    description: '보너스 금액 (스냅샷)',
    example: '100.00',
    type: String,
  })
  bonusAmount: string;

  @ApiProperty({
    description: '목표 롤링 금액',
    example: '2000.00',
    type: String,
  })
  targetRollingAmount: string;

  @ApiProperty({
    description: '현재 롤링 금액',
    example: '500.00',
    type: String,
  })
  currentRollingAmount: string;

  @ApiProperty({
    description: '통화',
    example: 'USDT',
  })
  currency: string;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;
}

export class MyPromotionsResponseDto {
  @ApiProperty({
    description: '사용자 프로모션 목록',
    type: [UserPromotionResponseDto],
  })
  promotions: UserPromotionResponseDto[];
}

