import { ApiProperty } from '@nestjs/swagger';
import { LoginUserResponseDto } from './login.response.dto';

export class AuthStatusResponseDto {
  @ApiProperty({ description: '인증 여부' })
  isAuthenticated: boolean;

  @ApiProperty({ type: LoginUserResponseDto, required: false, nullable: true })
  user: LoginUserResponseDto | null;
}
