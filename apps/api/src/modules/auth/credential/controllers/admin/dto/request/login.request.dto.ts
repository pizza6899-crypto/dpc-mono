import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginRequestDto {
  @ApiProperty({ description: '관리자 이메일', example: 'admin@dpc.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '관리자 비밀번호', example: 'admin123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
