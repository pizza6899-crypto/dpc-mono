import { ApiProperty } from '@nestjs/swagger';
import { UserRoleType, UserStatus } from '@repo/database';

export class RegisterAdminResponseDto {
  @ApiProperty({ description: 'User UID' })
  uid: string;

  @ApiProperty({ description: 'Email' })
  email: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRoleType,
  })
  role: UserRoleType;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
  })
  status: UserStatus;
}

