import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginRequestDto {
  @ApiProperty({
    description: 'Admin Login ID / 관리자 로그인 ID',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  loginId: string;

  @ApiProperty({
    description: 'Admin Password / 관리자 비밀번호',
    example: 'admin123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
