import { ApiProperty } from '@nestjs/swagger';

export class UserLoginUserResponseDto {
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @ApiProperty({ description: '사용자 이메일' })
  email: string;
}

export class UserLoginResponseDto {
  @ApiProperty({ type: UserLoginUserResponseDto })
  user: UserLoginUserResponseDto;
}
