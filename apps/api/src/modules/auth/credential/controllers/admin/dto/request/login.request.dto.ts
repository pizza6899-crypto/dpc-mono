import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginRequestDto {
  @ApiProperty({ description: '관리자 로그인 ID', example: 'admin_user' })
  @IsString()
  @IsNotEmpty()
  loginId: string;

  @ApiProperty({ description: '관리자 비밀번호', example: 'admin123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
