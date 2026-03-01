import { ApiProperty } from '@nestjs/swagger';

/**
 * Admin Login Response (Flat id only)
 */
export class AdminLoginResponseDto {
  @ApiProperty({ description: 'Admin ID / 관리자 ID' })
  id: string;
}
