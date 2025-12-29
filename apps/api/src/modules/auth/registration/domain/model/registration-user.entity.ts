import type { UserRoleType, SocialType } from '@repo/database';
import { UserStatus } from '@repo/database';

/**
 * Registration 도메인 엔티티
 *
 * 회원가입 과정에서 다루는 사용자 정보를 표현합니다.
 * CredentialUser와 달리 소셜 로그인 정보도 포함합니다.
 */
export class RegistrationUser {
  private constructor(
    public readonly id: bigint,
    public readonly uid: string,
    public readonly email: string,
    public readonly passwordHash: string | null,
    public readonly socialId: string | null,
    public readonly socialType: SocialType | null,
    public readonly status: UserStatus,
    public readonly role: UserRoleType,
  ) {}

  /**
   * 새로운 RegistrationUser 생성
   * @description Application 레이어에서 새 사용자 생성 시 사용
   * @param params - 사용자 생성 파라미터
   * @returns RegistrationUser 엔티티 인스턴스
   */
  static create(params: {
    id: bigint;
    uid: string;
    email: string;
    passwordHash: string | null;
    socialId: string | null;
    socialType: SocialType | null;
    status: UserStatus;
    role: UserRoleType;
  }): RegistrationUser {
    return new RegistrationUser(
      params.id,
      params.uid,
      params.email,
      params.passwordHash,
      params.socialId,
      params.socialType,
      params.status,
      params.role,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   * @description Repository에서 Prisma를 통해 생성/조회된 데이터를 Domain Entity로 변환할 때 사용
   * @param data - DB에서 조회한 사용자 데이터
   * @returns RegistrationUser 엔티티 인스턴스
   */
  static fromPersistence(data: {
    id: bigint;
    uid: string;
    email: string;
    passwordHash: string | null;
    socialId: string | null;
    socialType: SocialType | null;
    status: UserStatus;
    role: UserRoleType;
  }): RegistrationUser {
    return new RegistrationUser(
      data.id,
      data.uid,
      data.email,
      data.passwordHash,
      data.socialId,
      data.socialType,
      data.status,
      data.role,
    );
  }

  // Business Logic Methods

  /**
   * 일반 회원가입 사용자인지 확인
   * @returns passwordHash가 있고 socialId가 없으면 true
   */
  isCredentialUser(): boolean {
    return this.passwordHash !== null && this.socialId === null;
  }

  /**
   * 소셜 회원가입 사용자인지 확인
   * @returns socialId가 있으면 true
   * @note isCredentialUser()와 상호 배타적이지 않을 수 있습니다.
   *       passwordHash와 socialId가 모두 null이면 둘 다 false를 반환합니다.
   */
  isSocialUser(): boolean {
    return this.socialId !== null;
  }

  /**
   * 사용자 타입이 유효한지 확인
   * @returns 일반 회원가입 또는 소셜 회원가입 중 하나만 true여야 함
   * @description passwordHash와 socialId의 조합이 비즈니스 규칙에 맞는지 검증합니다.
   *              - 일반 회원가입: passwordHash !== null && socialId === null
   *              - 소셜 회원가입: passwordHash === null && socialId !== null
   */
  hasValidUserType(): boolean {
    // 일반 회원가입: passwordHash가 있고 socialId가 없어야 함
    const isValidCredential =
      this.passwordHash !== null && this.socialId === null;
    // 소셜 회원가입: passwordHash가 없고 socialId가 있어야 함
    const isValidSocial =
      this.passwordHash === null && this.socialId !== null;

    return isValidCredential || isValidSocial;
  }

  /**
   * 사용자가 활성 상태인지 확인
   * @returns status가 ACTIVE이면 true
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
}
