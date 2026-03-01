import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserLoginRequestDto {
  @ApiProperty({ description: 'Login ID (Email, Username, Phone) / 로그인 ID (이메일, 사용자명, 휴대폰)', example: 'user123' })
  @IsString()
  @IsNotEmpty()
  loginId: string;

  @ApiProperty({ description: 'Password / 비밀번호', example: 'password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
