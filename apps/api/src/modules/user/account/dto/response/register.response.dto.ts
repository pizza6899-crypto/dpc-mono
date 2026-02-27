import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({ description: 'User ID / 사용자 ID' })
  id: string;

  @ApiProperty({ description: 'Email / 이메일' })
  email: string | null;
}
