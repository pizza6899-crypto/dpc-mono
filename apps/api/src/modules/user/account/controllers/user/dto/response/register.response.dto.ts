import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Obfuscated User ID / 난독화된 사용자 ID',
    example: 'ad83k2msh',
  })
  id: string;

  @ApiProperty({
    description: 'Login ID / 로그인 아이디',
    example: 'user123',
    nullable: true,
  })
  loginId: string | null;
}
