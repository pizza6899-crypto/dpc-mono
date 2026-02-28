import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestPasswordResetRequestDto {
  @ApiProperty({ description: 'Login ID or Email / 로그인 ID 또는 이메일', example: 'user@example.com' })
  @IsNotEmpty()
  loginId: string;
}
