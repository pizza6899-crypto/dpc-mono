// src/modules/promotion/controllers/admin/dto/response/promotion-statistics.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PromotionStatisticsResponseDto {
  @ApiProperty({
    description: '전체 참가자 수',
    example: 100,
  })
  totalParticipants: number;

  @ApiProperty({
    description: '상태별 참가자 수',
    example: {
      ACTIVE: 50,
      QUALIFICATION_LOST: 20,
      EXPIRED: 20,
      FAILED: 10,
    },
    type: Object,
    additionalProperties: { type: 'number' },
  })
  statusCounts: Record<string, number>;
}
