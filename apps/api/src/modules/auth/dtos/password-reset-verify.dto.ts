// src/modules/auth/dtos/password-reset-verify.dto.ts
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetVerifyDto {
  @ApiProperty({
    description: 'Reset token (재설정 토큰)',
  })
  @IsString()
  token: string;
}

export class PasswordResetVerifyResponseDto {
  @ApiProperty({
    description: 'Token is valid (토큰이 유효한지)',
  })
  valid: boolean;

  @ApiProperty({
    description: 'Token is already used (토큰이 이미 사용되었는지)',
    required: false,
  })
  used?: boolean;
}
