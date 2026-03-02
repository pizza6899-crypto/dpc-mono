import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetUserPasswordResponseDto {
  @ApiProperty({
    description: 'Message / 메시지',
    example: 'Password has been reset.',
  })
  message: string;

  @ApiPropertyOptional({
    description:
      'Generated Password (if auto-generated) / 생성된 비밀번호 (자동 생성된 경우)',
    example: 'Abc123xy',
  })
  generatedPassword?: string;

  @ApiPropertyOptional({
    description: 'Target User Email / 대상 사용자 이메일',
    example: 'user@example.com',
  })
  targetUserEmail?: string;
}
