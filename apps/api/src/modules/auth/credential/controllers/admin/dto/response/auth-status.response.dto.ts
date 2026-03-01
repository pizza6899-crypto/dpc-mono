import { ApiProperty } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';

export class AdminUserInfoResponseDto {
  @ApiProperty({ description: 'Admin ID / 관리자 ID' })
  id: string;

  @ApiProperty({ enum: UserRoleType, description: 'Admin Role / 관리자 권한' })
  role: UserRoleType;
}

export class AdminAuthStatusResponseDto {
  @ApiProperty({ description: 'Is Authenticated / 인증 여부' })
  isAuthenticated: boolean;

  @ApiProperty({
    type: AdminUserInfoResponseDto,
    description: 'Admin User Info / 관리자 정보 (인증되지 않은 경우 null)',
    nullable: true,
  })
  user: AdminUserInfoResponseDto | null;
}
