import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordRequestDto {
  @ApiProperty({ description: 'Password Reset Token / 비밀번호 재설정 토큰', example: 'clx...' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'New Password / 새 비밀번호', example: 'newPassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
