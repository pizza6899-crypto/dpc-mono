// src/modules/promotion/campaign/controllers/user/dto/response/user-promotion.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UserPromotionResponseDto {
  @ApiProperty({
    description: 'User Promotion ID (Encoded) / 사용자 프로모션 ID (인코딩됨)',
    example: 'up_abc123',
  })
  id: string;

  @ApiProperty({
    description: 'Promotion status / 프로모션 상태',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Deposit amount / 입금 금액',
    example: '100.00',
    type: String,
  })
  depositAmount: string;

  @ApiProperty({
    description: 'Bonus amount / 보너스 금액',
    example: '100.00',
    type: String,
  })
  bonusAmount: string;

  @ApiProperty({
    description: 'Currency / 통화',
    example: 'USDT',
  })
  currency: string;

  @ApiProperty({
    description: 'Created at / 생성일시',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Completed at / 완료일시',
    example: '2024-01-01T00:00:00Z',
    nullable: true,
  })
  completedAt: Date | null;
}

export class MyPromotionsResponseDto {
  @ApiProperty({
    description: 'List of user promotions / 사용자 프로모션 목록',
    type: [UserPromotionResponseDto],
  })
  promotions: UserPromotionResponseDto[];
}
