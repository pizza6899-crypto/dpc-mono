import type { OAuthProvider, RegistrationMethod } from '@prisma/client';

/**
 * UserAuth Value Object
 *
 * 사용자 인증 관련 정보를 담당하는 Value Object입니다.
 * 로그인 ID, 비밀번호 해시, 등록 방식 및 OAuth 정보를 포함합니다.
 */
export class UserAuth {
  private constructor(
    public readonly loginId: string,
    public readonly registrationMethod: RegistrationMethod,
    public readonly email: string | null,
    public readonly passwordHash: string | null,
    public readonly oauthProvider: OAuthProvider | null,
    public readonly oauthId: string | null,
  ) {
    // 이메일이 있는 경우 형식 검증
    if (email && !this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * UserAuth 생성
   */
  static create(params: {
    loginId: string;
    registrationMethod: RegistrationMethod;
    email: string | null;
    passwordHash: string | null;
    oauthProvider: OAuthProvider | null;
    oauthId: string | null;
  }): UserAuth {
    return new UserAuth(
      params.loginId,
      params.registrationMethod,
      params.email,
      params.passwordHash,
      params.oauthProvider,
      params.oauthId,
    );
  }

  /**
   * Persistence 데이터로부터 생성
   */
  static fromPersistence(data: {
    loginId: string;
    registrationMethod: RegistrationMethod;
    email: string | null;
    passwordHash: string | null;
    oauthProvider: OAuthProvider | null;
    oauthId: string | null;
  }): UserAuth {
    return new UserAuth(
      data.loginId,
      data.registrationMethod,
      data.email,
      data.passwordHash,
      data.oauthProvider,
      data.oauthId,
    );
  }

  /**
   * Persistence 레이어로 변환
   */
  toPersistence(): {
    loginId: string;
    registrationMethod: RegistrationMethod;
    email: string | null;
    passwordHash: string | null;
    oauthProvider: OAuthProvider | null;
    oauthId: string | null;
  } {
    return {
      loginId: this.loginId,
      registrationMethod: this.registrationMethod,
      email: this.email,
      passwordHash: this.passwordHash,
      oauthProvider: this.oauthProvider,
      oauthId: this.oauthId,
    };
  }

  /**
   * 일반 회원가입 사용자인지 확인
   */
  isCredentialUser(): boolean {
    return this.registrationMethod === 'FULL';
  }

  /**
   * 소셜 회원가입 사용자인지 확인
   */
  isSocialUser(): boolean {
    return this.registrationMethod === 'OAUTH';
  }

  /**
   * 사용자 타입이 유효한지 확인
   */
  hasValidUserType(): boolean {
    if (this.registrationMethod === 'FULL') {
      return this.passwordHash !== null;
    }
    if (this.registrationMethod === 'OAUTH') {
      return this.oauthId !== null && this.oauthProvider !== null;
    }
    return true; // QUICK 가입 등 다른 방식은 추가 로직 가능
  }

  /**
   * 비밀번호 해시로 새로운 UserAuth 인스턴스 생성 (불변성 유지)
   */
  withPasswordHash(passwordHash: string | null): UserAuth {
    return new UserAuth(
      this.loginId,
      this.registrationMethod,
      this.email,
      passwordHash,
      this.oauthProvider,
      this.oauthId,
    );
  }

  /**
   * 이메일로 새로운 UserAuth 인스턴스 생성 (불변성 유지)
   */
  withEmail(email: string | null): UserAuth {
    return new UserAuth(
      this.loginId,
      this.registrationMethod,
      email,
      this.passwordHash,
      this.oauthProvider,
      this.oauthId,
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
