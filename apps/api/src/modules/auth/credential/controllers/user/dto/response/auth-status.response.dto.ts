import { ApiProperty } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';

export class UserInfoStatusResponseDto {
  @ApiProperty({ description: 'User ID / 사용자 ID' })
  id: string;

  @ApiProperty({ enum: UserRoleType, description: 'User Role / 사용자 권한' })
  role: UserRoleType;
}

export class UserAuthStatusResponseDto {
  @ApiProperty({ description: 'Is Authenticated / 인증 여부' })
  isAuthenticated: boolean;

  @ApiProperty({
    type: UserInfoStatusResponseDto,
    description: 'User Info / 사용자 정보 (인증되지 않은 경우 null)',
    nullable: true,
  })
  user: UserInfoStatusResponseDto | null;
}
