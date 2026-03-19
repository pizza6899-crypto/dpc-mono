import { ApiProperty } from '@nestjs/swagger';

/**
 * 입금 취소 응답 DTO
 */
export class CancelDepositResponseDto {
  @ApiProperty({ description: '성공 여부 / Success status' })
  success: boolean;
}
