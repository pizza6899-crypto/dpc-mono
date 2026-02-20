import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetResponseDto {
  @ApiProperty({
    description: '메시지',
    example: '비밀번호 재설정 이메일이 발송되었습니다.',
  })
  message: string;
}
