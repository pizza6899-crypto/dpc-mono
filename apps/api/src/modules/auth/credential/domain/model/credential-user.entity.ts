import { UserStatus, UserRoleType } from '@repo/database';

export class CredentialUser {
  private constructor(
    public readonly id: string | null, // 내부 관리용 (DB 저장 시 자동 생성)
    public readonly email: string,
    public readonly passwordHash: string | null,
    public readonly status: UserStatus,
    public readonly role: UserRoleType,
  ) {}

  /**
   * 새로운 CredentialUser 생성
   * @description Application 레이어에서 새 사용자 생성 시 사용
   * @param params - 사용자 생성 파라미터
   * @param params.id - 사용자 ID (선택적, DB 저장 시 자동 생성)
   * @returns CredentialUser 엔티티 인스턴스
   */
  static create(params: {
    id?: string;
    email: string;
    passwordHash: string | null;
    status: UserStatus;
    role: UserRoleType;
  }): CredentialUser {
    return new CredentialUser(
      params.id ?? null,
      params.email,
      params.passwordHash,
      params.status,
      params.role,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   * @description Repository에서 Prisma를 통해 생성/조회된 데이터를 Domain Entity로 변환할 때 사용
   * @param data - DB에서 조회한 사용자 데이터
   * @returns CredentialUser 엔티티 인스턴스
   */
  static fromPersistence(data: {
    id: string | null;
    email: string;
    passwordHash: string | null;
    status: UserStatus;
    role: UserRoleType;
  }): CredentialUser {
    return new CredentialUser(
      data.id,
      data.email,
      data.passwordHash,
      data.status,
      data.role,
    );
  }

  // Business Logic Methods

  /**
   * 사용자가 활성 상태인지 확인
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * 사용자가 관리자 권한을 가지고 있는지 확인
   */
  isAdmin(): boolean {
    return (
      this.role === UserRoleType.ADMIN || this.role === UserRoleType.SUPER_ADMIN
    );
  }
}
