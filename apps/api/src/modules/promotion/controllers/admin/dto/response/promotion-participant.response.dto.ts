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

  @ApiPropertyOptional({
    description: '프로모션 코드',
    example: 'WELCOME_BONUS',
  })
  promotionCode?: string | null;

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
    description: '목표 롤링 금액',
    example: '1000.00',
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
    description: '통화 코드',
    example: 'USDT',
  })
  currency: string;

  @ApiProperty({
    description: '보너스 지급 여부',
    example: true,
  })
  bonusGranted: boolean;

  @ApiProperty({
    description: '롤링 완료 여부',
    example: false,
  })
  rollingCompleted: boolean;

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

export class PromotionParticipantListResponseDto {
  @ApiProperty({
    description: '참가자 목록',
    type: [PromotionParticipantResponseDto],
  })
  participants: PromotionParticipantResponseDto[];

  @ApiProperty({
    description: '전체 참가자 수',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지당 항목 수',
    example: 20,
  })
  limit: number;
}
