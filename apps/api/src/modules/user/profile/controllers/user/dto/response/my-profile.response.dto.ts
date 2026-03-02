import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Language,
  UserRoleType,
  UserStatus,
  ExchangeCurrencyCode,
} from '@prisma/client';

export class MyProfileResponseDto {
  @ApiProperty({ description: 'User ID (Opaque) / 사용자 ID (난독화)' })
  id: string;

  @ApiProperty({ description: 'Login ID / 로그인 ID' })
  loginId: string | null;

  @ApiProperty({ description: 'Nickname / 닉네임' })
  nickname: string;

  @ApiPropertyOptional({ description: 'Avatar URL / 아바타 URL' })
  avatarUrl: string | null;

  @ApiPropertyOptional({ description: 'Email / 이메일' })
  email: string | null;

  @ApiProperty({ description: 'Role / 역할', enum: UserRoleType })
  role: UserRoleType;

  @ApiProperty({ description: 'Status / 상태', enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ description: 'Language / 언어', enum: Language })
  language: Language;

  @ApiPropertyOptional({ description: 'Country Code / 국가 코드' })
  country: string | null;

  @ApiPropertyOptional({ description: 'Timezone / 타임존' })
  timezone: string | null;

  @ApiProperty({
    description: 'Primary Currency / 주 통화',
    enum: ExchangeCurrencyCode,
  })
  primaryCurrency: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Play Currency / 게임 통화',
    enum: ExchangeCurrencyCode,
  })
  playCurrency: ExchangeCurrencyCode;

  @ApiProperty({ description: 'Email Verified / 이메일 인증 여부' })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Phone Verified / 휴대폰 인증 여부' })
  isPhoneVerified: boolean;

  @ApiPropertyOptional({ description: 'Phone Number / 휴대폰 번호' })
  phoneNumber: string | null;

  @ApiProperty({ description: 'Created At / 가입일' })
  createdAt: Date;
}
