// src/modules/user/controllers/admin/dto/response/user-list.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserRoleType, UserStatus } from 'src/generated/prisma';

export class UserListItemDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '1234567890123456789',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: '이메일',
    example: 'user@example.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description: '사용자 역할',
    enum: UserRoleType,
    example: UserRoleType.USER,
  })
  role: UserRoleType;

  @ApiProperty({
    description: '사용자 상태',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({
    description: '국가 코드',
    example: 'KR',
    nullable: true,
  })
  country: string | null;

  @ApiProperty({
    description: '타임존',
    example: 'Asia/Seoul',
    nullable: true,
  })
  timezone: string | null;

  @ApiProperty({
    description: '가입일',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '최종 수정일',
    example: '2024-01-02T00:00:00Z',
  })
  updatedAt: Date;
}

export class UserListResponseDto {
  @ApiProperty({
    description: '사용자 목록',
    type: [UserListItemDto],
  })
  data: UserListItemDto[];

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지당 항목 수',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: '전체 항목 수',
    example: 100,
  })
  total: number;
}

