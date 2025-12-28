import { ApiProperty } from '@nestjs/swagger';
import { CredentialUserLoginUserResponseDto } from './login.response.dto';

export class CredentialUserAuthStatusResponseDto {
  @ApiProperty({ description: '인증 여부' })
  isAuthenticated: boolean;

  @ApiProperty({ type: CredentialUserLoginUserResponseDto, required: false, nullable: true })
  user: CredentialUserLoginUserResponseDto | null;
}
