// src/modules/user/profile/domain/model/value-objects/user-trust.vo.ts

/**
 * UserTrust Value Object
 *
 * 사용자의 신뢰도 및 인증 상태를 담당하는 Value Object입니다.
 */
export class UserTrust {
    private constructor(
        public readonly isEmailVerified: boolean,
        public readonly isPhoneVerified: boolean,
        public readonly isTelegramVerified: boolean,
        public readonly isIdentityVerified: boolean,
        public readonly isBankVerified: boolean,
        public readonly isKycMandatory: boolean,
    ) { }

    /**
     * UserTrust 생성 (기본값 설정)
     */
    static create(params?: Partial<{
        isEmailVerified: boolean,
        isPhoneVerified: boolean,
        isTelegramVerified: boolean,
        isIdentityVerified: boolean,
        isBankVerified: boolean,
        isKycMandatory: boolean,
    }>): UserTrust {
        return new UserTrust(
            params?.isEmailVerified ?? false,
            params?.isPhoneVerified ?? false,
            params?.isTelegramVerified ?? false,
            params?.isIdentityVerified ?? false,
            params?.isBankVerified ?? false,
            params?.isKycMandatory ?? false,
        );
    }

    /**
     * Persistence 데이터로부터 생성
     */
    static fromPersistence(data: {
        isEmailVerified: boolean,
        isPhoneVerified: boolean,
        isTelegramVerified: boolean,
        isIdentityVerified: boolean,
        isBankVerified: boolean,
        isKycMandatory: boolean,
    }): UserTrust {
        return new UserTrust(
            data.isEmailVerified,
            data.isPhoneVerified,
            data.isTelegramVerified,
            data.isIdentityVerified,
            data.isBankVerified,
            data.isKycMandatory,
        );
    }

    /**
     * Persistence 레이어로 변환
     */
    toPersistence(): {
        isEmailVerified: boolean,
        isPhoneVerified: boolean,
        isTelegramVerified: boolean,
        isIdentityVerified: boolean,
        isBankVerified: boolean,
        isKycMandatory: boolean,
    } {
        return {
            isEmailVerified: this.isEmailVerified,
            isPhoneVerified: this.isPhoneVerified,
            isTelegramVerified: this.isTelegramVerified,
            isIdentityVerified: this.isIdentityVerified,
            isBankVerified: this.isBankVerified,
            isKycMandatory: this.isKycMandatory,
        };
    }

    /**
     * 휴대폰 인증 상태로 변경
     */
    verifyPhone(): UserTrust {
        return new UserTrust(
            this.isEmailVerified,
            true, // isPhoneVerified
            this.isTelegramVerified,
            this.isIdentityVerified,
            this.isBankVerified,
            this.isKycMandatory,
        );
    }

    /**
     * 이메일 인증 상태로 변경
     */
    verifyEmail(): UserTrust {
        return new UserTrust(
            true, // isEmailVerified
            this.isPhoneVerified,
            this.isTelegramVerified,
            this.isIdentityVerified,
            this.isBankVerified,
            this.isKycMandatory,
        );
    }
}
