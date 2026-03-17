// src/modules/promotion/campaign/controllers/admin/dto/response/promotion-statistics.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PromotionStatisticsResponseDto {
  @ApiProperty({
    description: 'Total number of participants / 전체 참가자 수',
    example: 100,
  })
  totalParticipants: number;

  @ApiProperty({
    description: 'Number of participants by status / 상태별 참가자 수',
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
