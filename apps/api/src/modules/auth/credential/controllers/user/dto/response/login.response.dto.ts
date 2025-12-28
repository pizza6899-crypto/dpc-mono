import { ApiProperty } from '@nestjs/swagger';

export class CredentialUserLoginUserResponseDto {
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @ApiProperty({ description: '사용자 이메일' })
  email: string;
}

export class CredentialUserLoginResponseDto {
  @ApiProperty({ type: CredentialUserLoginUserResponseDto })
  user: CredentialUserLoginUserResponseDto;
}
