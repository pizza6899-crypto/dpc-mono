import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsArray,
} from 'class-validator';
import {
  ExchangeCurrencyCode,
  Language,
  LoginIdType,
  OAuthProvider,
  UserStatus,
} from '@prisma/client';

export class UpdateUserConfigDto {
  @ApiPropertyOptional({ description: 'Allow Signup / 회원가입 허용 여부' })
  @IsOptional()
  @IsBoolean()
  allowSignup?: boolean;

  @ApiPropertyOptional({
    enum: UserStatus,
    description: 'Default Status / 가입 시 기본 상태',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  defaultStatus?: UserStatus;

  @ApiPropertyOptional({
    description: 'Max Daily Signup Per IP / IP당 일일 최대 가입 수',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDailySignupPerIp?: number;

  @ApiPropertyOptional({
    enum: LoginIdType,
    description: 'Login ID Type / 로그인 아이디 타입',
  })
  @IsOptional()
  @IsEnum(LoginIdType)
  loginIdType?: LoginIdType;

  @ApiPropertyOptional({ description: 'Require Email / 이메일 필수 여부' })
  @IsOptional()
  @IsBoolean()
  requireEmail?: boolean;

  @ApiPropertyOptional({
    description: 'Require Phone Number / 휴대폰 번호 필수 여부',
  })
  @IsOptional()
  @IsBoolean()
  requirePhoneNumber?: boolean;

  @ApiPropertyOptional({
    description: 'Require Birth Date / 생년월일 필수 여부',
  })
  @IsOptional()
  @IsBoolean()
  requireBirthDate?: boolean;

  @ApiPropertyOptional({ description: 'Require Nickname / 닉네임 필수 여부' })
  @IsOptional()
  @IsBoolean()
  requireNickname?: boolean;

  @ApiPropertyOptional({
    description: 'Require Referral Code / 추천 코드 필수 여부',
  })
  @IsOptional()
  @IsBoolean()
  requireReferralCode?: boolean;

  @ApiPropertyOptional({
    enum: OAuthProvider,
    isArray: true,
    description: 'Allowed OAuth Providers / 허용된 소셜 로그인 제공자',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(OAuthProvider, { each: true })
  allowedOAuthProviders?: OAuthProvider[];

  @ApiPropertyOptional({
    nullable: true,
    description: 'Login ID Email Regex / 이메일 정규식',
  })
  @IsOptional()
  @IsString()
  loginIdEmailRegex?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Login ID Phone Number Regex / 휴대폰 번호 정규식',
  })
  @IsOptional()
  @IsString()
  loginIdPhoneNumberRegex?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Login ID Username Regex / 일반 아이디 정규식',
  })
  @IsOptional()
  @IsString()
  loginIdUsernameRegex?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Nickname Regex / 닉네임 정규식',
  })
  @IsOptional()
  @IsString()
  nicknameRegex?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Password Regex / 비밀번호 정규식',
  })
  @IsOptional()
  @IsString()
  passwordRegex?: string | null;

  @ApiPropertyOptional({
    enum: ExchangeCurrencyCode,
    description: 'Default Primary Currency / 기본 메인 통화',
  })
  @IsOptional()
  @IsEnum(ExchangeCurrencyCode)
  defaultPrimaryCurrency?: ExchangeCurrencyCode;

  @ApiPropertyOptional({
    enum: ExchangeCurrencyCode,
    description: 'Default Play Currency / 기본 게임 통화',
  })
  @IsOptional()
  @IsEnum(ExchangeCurrencyCode)
  defaultPlayCurrency?: ExchangeCurrencyCode;

  @ApiPropertyOptional({
    enum: Language,
    description: 'Default Language / 기본 언어',
  })
  @IsOptional()
  @IsEnum(Language)
  defaultLanguage?: Language;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Admin Note / 관리자 메모',
  })
  @IsOptional()
  @IsString()
  adminNote?: string | null;
}
