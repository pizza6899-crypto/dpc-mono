import { ApiProperty } from '@nestjs/swagger';

export class PasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password reset email sent successfully',
  })
  message: string;
}
