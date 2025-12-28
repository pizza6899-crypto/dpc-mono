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
    public readonly id: string,
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
    id: string;
    email: string;
    passwordHash: string | null;
    socialId: string | null;
    socialType: SocialType | null;
    status: UserStatus;
    role: UserRoleType;
  }): RegistrationUser {
    return new RegistrationUser(
      params.id,
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
    id: string;
    email: string;
    passwordHash: string | null;
    socialId: string | null;
    socialType: SocialType | null;
    status: UserStatus;
    role: UserRoleType;
  }): RegistrationUser {
    return new RegistrationUser(
      data.id,
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
   */
  isSocialUser(): boolean {
    return this.socialId !== null;
  }

  /**
   * 사용자가 활성 상태인지 확인
   * @returns status가 ACTIVE이면 true
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
}
