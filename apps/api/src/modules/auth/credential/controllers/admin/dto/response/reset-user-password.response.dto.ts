import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetUserPasswordResponseDto {
  @ApiProperty({
    description: '메시지',
    example: '비밀번호가 초기화되었습니다.',
  })
  message: string;

  @ApiPropertyOptional({
    description: '생성된 비밀번호 (자동 생성된 경우)',
    example: 'Abc123xy',
  })
  generatedPassword?: string;

  @ApiPropertyOptional({
    description: '대상 사용자 이메일',
    example: 'user@example.com',
  })
  targetUserEmail?: string;
}
