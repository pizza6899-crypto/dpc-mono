// src/modules/promotion/campaign/controllers/admin/dto/response/promotion-participant.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PromotionParticipantResponseDto {
  @ApiProperty({
    description: 'UserPromotion ID / UserPromotion ID',
    example: '1',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'User ID / 사용자 ID',
    example: '1234567890123456789',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: 'User email / 사용자 이메일',
    example: 'user@example.com',
    nullable: true,
  })
  userEmail: string | null;

  @ApiProperty({
    description: 'Promotion ID / 프로모션 ID',
    example: '1',
    type: String,
  })
  promotionId: string;

  @ApiProperty({
    description: 'Status / 상태',
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
    example: '50.00',
    type: String,
  })
  bonusAmount: string;

  @ApiProperty({
    description: 'Currency code / 통화 코드',
    example: 'USDT',
  })
  currency: string;

  @ApiProperty({
    description: 'Participation date / 참가일시',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at / 수정일시',
    example: '2024-01-02T00:00:00Z',
  })
  updatedAt: Date;
}
