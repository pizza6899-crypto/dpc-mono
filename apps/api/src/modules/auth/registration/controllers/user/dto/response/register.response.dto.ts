import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: bigint;

  @ApiProperty({ description: 'Email' })
  email: string;
}
