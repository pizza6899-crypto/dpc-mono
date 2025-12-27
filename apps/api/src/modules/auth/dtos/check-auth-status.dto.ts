import { ApiProperty } from '@nestjs/swagger';
import { AuthResponseDto } from './auth-response.dto';

export class CheckAuthStatusResponseDto {
  @ApiProperty({ description: '로그인 여부' })
  isAuthenticated: boolean;

  @ApiProperty({
    description: '사용자 정보 (로그인된 경우에만 제공)',
    type: AuthResponseDto,
    required: false,
    nullable: true,
  })
  user: AuthResponseDto | null;
}
