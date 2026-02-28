import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginUserResponseDto {
  @ApiProperty({ description: 'Admin ID / 관리자 ID' })
  id: string;

  @ApiProperty({ description: 'Admin Email / 관리자 이메일' })
  email: string;
}

export class AdminLoginResponseDto {
  @ApiProperty({ type: AdminLoginUserResponseDto })
  user: AdminLoginUserResponseDto;
}
