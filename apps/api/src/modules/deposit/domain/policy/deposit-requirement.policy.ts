import { Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import {
    UserStatusNotActiveException,
    PhoneNotVerifiedException,
    IdentityNotVerifiedException,
} from '../deposit.exception';

/**
 * 입금 신청을 위한 유저 요구조건 컨텍스트
 * 유저 테이블의 모든 필드를 가져오는 대신, 검증에 필요한 필드만 정의합니다.
 */
export interface DepositUserContext {
    status: UserStatus;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isIdentityVerified: boolean;
    isKycMandatory: boolean;
}

/**
 * 입금 요구조건 도메인 정책 (Domain Policy)
 * 피아트(Fiat)와 크립토(Crypto) 각각의 비즈니스 규칙을 정의합니다.
 */
@Injectable()
export class DepositRequirementPolicy {
    /**
     * 공통 검증: 유저 상태가 ACTIVE인지 확인
     */
    private validateActiveStatus(user: DepositUserContext): void {
        if (user.status !== UserStatus.ACTIVE) {
            throw new UserStatusNotActiveException(user.status);
        }
    }

    /**
     * 피아트(Fiat/무통장) 입금 요구조건 검증
     */
    validateFiatRequirements(user: DepositUserContext): void {
        // 1. 공통 상태 체크
        this.validateActiveStatus(user);

        // 2. 피아트 특화 조건: 휴대폰 인증 필수
        if (!user.isPhoneVerified) {
            throw new PhoneNotVerifiedException();
        }

        // 3. KYC 강제 대상인 경우 인증 여부 체크
        if (user.isKycMandatory && !user.isIdentityVerified) {
            throw new IdentityNotVerifiedException();
        }
    }

    /**
     * 크립토(Crypto) 입금 요구조건 검증
     */
    validateCryptoRequirements(user: DepositUserContext): void {
        // 1. 공통 상태 체크
        this.validateActiveStatus(user);

        // 2. 크립토는 현재 별도의 추가 인증 없이 허용 (모든 조건 허용)
    }
}
