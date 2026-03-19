import { ApiProperty } from '@nestjs/swagger';

/**
 * Unread Count Response DTO / 읽지 않은 알림 수 응답 DTO
 */
export class UnreadCountResponseDto {
  @ApiProperty({
    description: 'Number of unread notifications / 읽지 않은 알림 수',
    example: 5,
  })
  count: number;
}
