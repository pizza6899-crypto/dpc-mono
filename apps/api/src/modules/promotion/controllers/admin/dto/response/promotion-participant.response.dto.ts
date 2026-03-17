// src/modules/promotion/controllers/admin/dto/response/promotion-participant.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PromotionParticipantResponseDto {
  @ApiProperty({
    description: 'UserPromotion ID',
    example: '1',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: '사용자 ID',
    example: '1234567890123456789',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
    nullable: true,
  })
  userEmail: string | null;

  @ApiProperty({
    description: '프로모션 ID',
    example: '1',
    type: String,
  })
  promotionId: string;

  @ApiProperty({
    description: '상태',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: '입금 금액',
    example: '100.00',
    type: String,
  })
  depositAmount: string;

  @ApiProperty({
    description: '보너스 금액',
    example: '50.00',
    type: String,
  })
  bonusAmount: string;

  @ApiProperty({
    description: '통화 코드',
    example: 'USDT',
  })
  currency: string;

  @ApiProperty({
    description: '참가일시',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-02T00:00:00Z',
  })
  updatedAt: Date;
}
