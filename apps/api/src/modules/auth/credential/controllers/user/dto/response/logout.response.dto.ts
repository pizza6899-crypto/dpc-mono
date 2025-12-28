import { ApiProperty } from '@nestjs/swagger';

export class CredentialUserLogoutResponseDto {
  @ApiProperty({
    description: 'Logout success',
    example: true,
  })
  success: boolean;
}

