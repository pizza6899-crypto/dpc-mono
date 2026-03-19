import { ApiProperty } from '@nestjs/swagger';
import {
  ExchangeCurrencyCode,
  Language,
  LoginIdType,
  OAuthProvider,
  UserStatus,
} from '@prisma/client';

export class UserConfigResponseDto {
  @ApiProperty({ description: 'ID / 아이디' })
  id: number;

  @ApiProperty({ description: 'Allow Signup / 회원가입 허용 여부' })
  allowSignup: boolean;

  @ApiProperty({
    enum: UserStatus,
    description: 'Default Status / 가입 시 기본 상태',
  })
  defaultStatus: UserStatus;

  @ApiProperty({
    description: 'Max Daily Signup Per IP / IP당 일일 최대 가입 수',
  })
  maxDailySignupPerIp: number;

  @ApiProperty({
    enum: LoginIdType,
    description: 'Login ID Type / 로그인 아이디 타입',
  })
  loginIdType: LoginIdType;

  @ApiProperty({ description: 'Require Email / 이메일 필수 여부' })
  requireEmail: boolean;

  @ApiProperty({ description: 'Require Phone Number / 휴대폰 번호 필수 여부' })
  requirePhoneNumber: boolean;

  @ApiProperty({ description: 'Require Birth Date / 생년월일 필수 여부' })
  requireBirthDate: boolean;

  @ApiProperty({ description: 'Require Nickname / 닉네임 필수 여부' })
  requireNickname: boolean;

  @ApiProperty({ description: 'Require Referral Code / 추천 코드 필수 여부' })
  requireReferralCode: boolean;

  @ApiProperty({
    enum: OAuthProvider,
    isArray: true,
    description: 'Allowed OAuth Providers / 허용된 소셜 로그인 제공자',
  })
  allowedOAuthProviders: OAuthProvider[];

  @ApiProperty({
    nullable: true,
    description: 'Login ID Email Regex / 이메일 정규식',
  })
  loginIdEmailRegex: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Login ID Phone Number Regex / 휴대폰 번호 정규식',
  })
  loginIdPhoneNumberRegex: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Login ID Username Regex / 일반 아이디 정규식',
  })
  loginIdUsernameRegex: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Nickname Regex / 닉네임 정규식',
  })
  nicknameRegex: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Password Regex / 비밀번호 정규식',
  })
  passwordRegex: string | null;

  @ApiProperty({
    enum: ExchangeCurrencyCode,
    description: 'Default Primary Currency / 기본 메인 통화',
  })
  defaultPrimaryCurrency: ExchangeCurrencyCode;

  @ApiProperty({
    enum: ExchangeCurrencyCode,
    description: 'Default Play Currency / 기본 게임 통화',
  })
  defaultPlayCurrency: ExchangeCurrencyCode;

  @ApiProperty({ enum: Language, description: 'Default Language / 기본 언어' })
  defaultLanguage: Language;

  @ApiProperty({ nullable: true, description: 'Admin Note / 관리자 메모' })
  adminNote: string | null;

  @ApiProperty({ nullable: true, description: 'Updated By / 수정자 ID' })
  updatedBy: string | null;

  @ApiProperty({ description: 'Created At / 생성일' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated At / 수정일' })
  updatedAt: Date;
}
