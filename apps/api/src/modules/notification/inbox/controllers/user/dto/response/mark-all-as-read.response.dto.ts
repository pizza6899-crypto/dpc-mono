import { ApiProperty } from '@nestjs/swagger';

/**
 * Mark All As Read Response DTO / 모든 알림 읽음 처리 완료 응답 DTO
 */
export class MarkAllAsReadResponseDto {
  @ApiProperty({
    description: 'Number of notifications updated / 업데이트된 알림 수',
    example: 10,
  })
  updatedCount: number;
}
