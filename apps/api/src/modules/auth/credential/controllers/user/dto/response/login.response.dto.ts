import { ApiProperty } from '@nestjs/swagger';

/**
 * User Login Response (Flat id only)
 */
export class UserLoginResponseDto {
  @ApiProperty({ description: 'User ID / 사용자 ID' })
  id: string;
}
