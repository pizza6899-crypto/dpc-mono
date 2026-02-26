import { ExchangeCurrencyCode, Language, LoginIdType, OAuthProvider, PrismaClient, UserStatus } from '@prisma/client';

export async function seedUserConfig(prisma: PrismaClient) {
    const configData = {
        allowSignup: true,
        defaultStatus: UserStatus.ACTIVE,
        maxDailySignupPerIp: 10,

        // [Registration Policy] 가입 정책
        loginIdType: LoginIdType.EMAIL,
        requireEmail: true,
        requirePhoneNumber: false,
        requireBirthDate: false,
        requireNickname: true,
        requireReferralCode: false,
        allowedOAuthProviders: [OAuthProvider.GOOGLE, OAuthProvider.APPLE, OAuthProvider.TELEGRAM],

        // [Registration Validation] 가입 유효성 검사 (Regex)
        loginIdEmailRegex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        loginIdPhoneNumberRegex: '^\\+?[1-9]\\d{1,14}$',
        loginIdUsernameRegex: '^[a-zA-Z0-9_]{4,16}$',
        nicknameRegex: '^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ_]{2,10}$',
        passwordRegex: '^(?=.*[a-z])(?=.*\\d).{8,20}$',

        // [Onboarding Defaults] 신규 가입 시 기본 설정
        defaultPrimaryCurrency: ExchangeCurrencyCode.USD,
        defaultPlayCurrency: ExchangeCurrencyCode.USD,
        defaultLanguage: Language.KO,

        adminNote: 'Initial system configuration seeded by developer.',
    };

    await prisma.userConfig.upsert({
        where: { id: 1 },
        update: {}, // 기존 데이터가 존재하면 변경하지 않음
        create: {
            id: 1,
            ...configData,
        },
    });

    console.log('✅ 전역 사용자 설정(UserConfig)이 시딩되었습니다.');
}

