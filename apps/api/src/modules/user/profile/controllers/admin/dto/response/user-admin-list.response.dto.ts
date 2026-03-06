import { ApiProperty } from '@nestjs/swagger';
import { UserRoleType, UserStatus, ExchangeCurrencyCode } from '@prisma/client';

export class UserAdminListItemDto {
  @ApiProperty({
    description: 'User ID / 사용자 ID',
    example: '1234567890123456789',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Login ID / 로그인 ID',
    example: 'user123',
    nullable: true,
  })
  loginId: string | null;

  @ApiProperty({
    description: 'Nickname / 닉네임',
    example: '홍길동',
  })
  nickname: string;

  @ApiProperty({
    description: 'User Email / 이메일',
    example: 'user@example.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description: 'User Role / 사용자 역할',
    enum: UserRoleType,
    example: UserRoleType.USER,
  })
  role: UserRoleType;

  @ApiProperty({
    description: 'User Status / 사용자 상태',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
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

  @ApiProperty({
    description: 'Created At / 가입일',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated At / 최종 수정일',
    example: '2024-01-02T00:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Primary Currency / 대표 통화',
    enum: ExchangeCurrencyCode,
    example: ExchangeCurrencyCode.USD,
  })
  primaryCurrency: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Play Currency / 게임 통화',
    enum: ExchangeCurrencyCode,
    example: ExchangeCurrencyCode.USD,
  })
  playCurrency: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Phone Number / 휴대폰 번호',
    example: '+821012345678',
    nullable: true,
  })
  phoneNumber: string | null;

  @ApiProperty({
    description: 'Email Verified / 이메일 인증 여부',
    example: true,
  })
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'Phone Verified / 휴대폰 인증 여부',
    example: false,
  })
  isPhoneVerified: boolean;

  @ApiProperty({
    description: 'Registration Method / 가입 경로',
    enum: ['CREDENTIAL', 'SOCIAL', 'ADMIN'],
    example: 'CREDENTIAL',
  })
  registrationMethod: string;
}
