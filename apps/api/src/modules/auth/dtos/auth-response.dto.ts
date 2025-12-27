import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Email' })
  email?: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'User information', type: AuthResponseDto })
  user: AuthResponseDto;
}
