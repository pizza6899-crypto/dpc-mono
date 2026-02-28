import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserLoginRequestDto {
  @ApiProperty({ description: '로그인 ID (Email, Username, Phone)', example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  loginId: string;

  @ApiProperty({ description: '비밀번호', example: 'password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
