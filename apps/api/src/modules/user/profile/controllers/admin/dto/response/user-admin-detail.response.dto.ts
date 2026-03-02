import { ApiProperty } from '@nestjs/swagger';
import { UserRoleType, UserStatus, ExchangeCurrencyCode } from '@prisma/client';

export class UserAdminDetailResponseDto {
  @ApiProperty({ description: 'User ID / 사용자 ID', example: '1234567890...' })
  id: string;

  @ApiProperty({
    description: 'Login ID / 로그인 ID',
    example: 'user123',
    nullable: true,
  })
  loginId: string | null;

  @ApiProperty({ description: 'Nickname / 닉네임', example: '홍길동' })
  nickname: string;

  @ApiProperty({
    description: 'User Email / 이메일',
    example: 'user@example.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({ description: 'User Role / 사용자 역할', enum: UserRoleType })
  role: UserRoleType;

  @ApiProperty({ description: 'User Status / 사용자 상태', enum: UserStatus })
  status: UserStatus;

  @ApiProperty({
    description: 'Country Code / 국가 코드',
    example: 'KR',
    nullable: true,
  })
  country: string | null;

  @ApiProperty({
    description: 'Timezone / 타임존',
    example: 'Asia/Seoul',
    nullable: true,
  })
  timezone: string | null;

  @ApiProperty({ description: 'Created At / 가입일' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated At / 최종 수정일' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Primary Currency / 대표 통화',
    enum: ExchangeCurrencyCode,
  })
  primaryCurrency: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Play Currency / 게임 통화',
    enum: ExchangeCurrencyCode,
  })
  playCurrency: ExchangeCurrencyCode;
}
