import { ApiProperty } from '@nestjs/swagger';
import { LoginIdType, OAuthProvider } from '@prisma/client';

export class UserPolicyResponseDto {
    @ApiProperty({ description: 'Allow signup / 회원가입 허용 여부' })
    allowSignup: boolean;

    @ApiProperty({ description: 'Login ID type / 로그인 ID 타입', enum: LoginIdType })
    loginIdType: LoginIdType;

    @ApiProperty({ description: 'Require nickname / 닉네임 필수 여부' })
    requireNickname: boolean;

    @ApiProperty({ description: 'Require referral code / 추천 코드 필수 여부' })
    requireReferralCode: boolean;

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
}
