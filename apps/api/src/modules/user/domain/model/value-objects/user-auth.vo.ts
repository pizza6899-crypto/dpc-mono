// src/modules/user/domain/model/value-objects/user-auth.vo.ts
import type { SocialType } from 'src/generated/prisma';

/**
 * UserAuth Value Object
 *
 * 사용자 인증 관련 정보를 담당하는 Value Object입니다.
 * 이메일, 비밀번호 해시, 소셜 로그인 정보를 포함합니다.
 */
export class UserAuth {
  private constructor(
    public readonly email: string,
    public readonly passwordHash: string | null,
    public readonly socialId: string | null,
    public readonly socialType: SocialType | null,
  ) {
    // 이메일 형식 검증
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // 비즈니스 규칙: 일반 회원가입 또는 소셜 회원가입 중 하나만 가능
    if (passwordHash !== null && socialId !== null) {
      throw new Error('Cannot have both passwordHash and socialId');
    }
  }

  /**
   * UserAuth 생성
   */
  static create(params: {
    email: string;
    passwordHash: string | null;
    socialId: string | null;
    socialType: SocialType | null;
  }): UserAuth {
    return new UserAuth(
      params.email,
      params.passwordHash,
      params.socialId,
      params.socialType,
    );
  }

  /**
   * Persistence 데이터로부터 생성
   */
  static fromPersistence(data: {
    email: string;
    passwordHash: string | null;
    socialId: string | null;
    socialType: SocialType | null;
  }): UserAuth {
    return new UserAuth(
      data.email,
      data.passwordHash,
      data.socialId,
      data.socialType,
    );
  }

  /**
   * Persistence 레이어로 변환
   */
  toPersistence(): {
    email: string;
    passwordHash: string | null;
    socialId: string | null;
    socialType: SocialType | null;
  } {
    return {
      email: this.email,
      passwordHash: this.passwordHash,
      socialId: this.socialId,
      socialType: this.socialType,
    };
  }

  /**
   * 일반 회원가입 사용자인지 확인
   */
  isCredentialUser(): boolean {
    return this.passwordHash !== null && this.socialId === null;
  }

  /**
   * 소셜 회원가입 사용자인지 확인
   */
  isSocialUser(): boolean {
    return this.socialId !== null;
  }

  /**
   * 사용자 타입이 유효한지 확인
   */
  hasValidUserType(): boolean {
    const isValidCredential =
      this.passwordHash !== null && this.socialId === null;
    const isValidSocial =
      this.passwordHash === null && this.socialId !== null;

    return isValidCredential || isValidSocial;
  }

  /**
   * 비밀번호 해시로 새로운 UserAuth 인스턴스 생성 (불변성 유지)
   */
  withPasswordHash(passwordHash: string | null): UserAuth {
    return new UserAuth(
      this.email,
      passwordHash,
      this.socialId,
      this.socialType,
    );
  }

  /**
   * 이메일 형식 검증
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

