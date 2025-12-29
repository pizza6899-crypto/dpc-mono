import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({ description: 'User UID' })
  uid: string;

  @ApiProperty({ description: 'Email' })
  email: string;
}
