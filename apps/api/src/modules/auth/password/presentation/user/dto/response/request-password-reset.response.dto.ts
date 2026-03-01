import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetResponseDto {
  @ApiProperty({
    description: 'Message / 메시지',
    example: 'Password reset email has been sent.',
  })
  message: string;
}
