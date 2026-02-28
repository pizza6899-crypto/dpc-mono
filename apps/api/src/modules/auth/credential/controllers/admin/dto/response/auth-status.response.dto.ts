import { ApiProperty } from '@nestjs/swagger';
import { AdminLoginUserResponseDto } from './login.response.dto';

export class AdminAuthStatusResponseDto {
  @ApiProperty({ description: 'Is Authenticated / 인증 여부' })
  isAuthenticated: boolean;

  @ApiProperty({
    type: AdminLoginUserResponseDto,
    required: false,
    nullable: true,
  })
  user: AdminLoginUserResponseDto | null;
}
