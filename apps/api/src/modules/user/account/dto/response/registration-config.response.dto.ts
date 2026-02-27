import { ApiProperty } from '@nestjs/swagger';
import { LoginIdType, OAuthProvider, ExchangeCurrencyCode, Language } from '@prisma/client';

export class RegistrationConfigResponseDto {
    @ApiProperty({ description: 'Allow signup / 회원가입 허용 여부' })
    allowSignup: boolean;

    @ApiProperty({ description: 'Login ID type / 로그인 ID 타입', enum: LoginIdType })
    loginIdType: LoginIdType;

    @ApiProperty({ description: 'Require email / 이메일 필수 여부' })
    requireEmail: boolean;

    @ApiProperty({ description: 'Require phone number / 휴대폰 번호 필수 여부' })
    requirePhoneNumber: boolean;

    @ApiProperty({ description: 'Require birth date / 생년월일 필수 여부' })
    requireBirthDate: boolean;

    @ApiProperty({ description: 'Require nickname / 닉네임 필수 여부' })
    requireNickname: boolean;

    @ApiProperty({ description: 'Require referral code / 추천 코드 필수 여부' })
    requireReferralCode: boolean;

    @ApiProperty({
        description: 'Allowed OAuth providers / 허용된 소셜 로그인 제공자',
        enum: OAuthProvider,
        isArray: true
    })
    allowedOAuthProviders: OAuthProvider[];

    @ApiProperty({ description: 'Login ID email regex / 로그인 ID(이메일) 유효성 검사 식', nullable: true })
    loginIdEmailRegex: string | null;

    @ApiProperty({ description: 'Login ID phone number regex / 로그인 ID(휴대폰) 유효성 검사 식', nullable: true })
    loginIdPhoneNumberRegex: string | null;

    @ApiProperty({ description: 'Login ID username regex / 로그인 ID(이름) 유효성 검사 식', nullable: true })
    loginIdUsernameRegex: string | null;

    @ApiProperty({ description: 'Nickname regex / 닉네임 유효성 검사 식', nullable: true })
    nicknameRegex: string | null;

    @ApiProperty({ description: 'Password regex / 비밀번호 유효성 검사 식', nullable: true })
    passwordRegex: string | null;

    @ApiProperty({ description: 'Default primary currency / 기본 대표 통화', enum: ExchangeCurrencyCode })
    defaultPrimaryCurrency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Default play currency / 기본 게임 통화', enum: ExchangeCurrencyCode })
    defaultPlayCurrency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Default language / 기본 언어', enum: Language })
    defaultLanguage: Language;
}
