import { ApiProperty } from '@nestjs/swagger';
import { UserLoginUserResponseDto } from './login.response.dto';

export class UserAuthStatusResponseDto {
  @ApiProperty({ description: '인증 여부' })
  isAuthenticated: boolean;

  @ApiProperty({
    type: UserLoginUserResponseDto,
    required: false,
    nullable: true,
  })
  user: UserLoginUserResponseDto | null;
}
