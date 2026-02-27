import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({ description: 'User ID / 사용자 ID' })
  id: string;

  @ApiProperty({ description: 'Login ID / 로그인 아이디' })
  loginId: string | null;

  @ApiProperty({ description: 'Nickname / 닉네임' })
  nickname: string;

  @ApiProperty({ description: 'Email / 이메일' })
  email: string | null;
}
