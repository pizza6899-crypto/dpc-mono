// src/modules/user/domain/model/user.entity.ts
import type { UserRoleType, SocialType } from '@repo/database';
import { UserStatus as PrismaUserStatus } from '@repo/database';
import { UserAuth } from './value-objects/user-auth.vo';
import { UserLocation } from './value-objects/user-location.vo';

/**
 * User 도메인 엔티티
 *
 * 사용자 계정 정보를 표현하는 도메인 엔티티입니다.
 * 현재는 계정 생성만 관리하며, Value Object 패턴을 사용하여 관련 필드를 논리적으로 그룹화했습니다.
 * - UserAuth: 인증 관련 정보 (이메일, 비밀번호, 소셜 로그인)
 * - UserLocation: 위치 정보 (국가, 타임존)
 * 
 * 추후 확장 예정:
 * - UserProfile: 프로필 정보 (닉네임, 아바타, 자기소개 등)
 * - UserStatus: 계정 상태 관리 (활성, 정지, 탈퇴 등)
 */
export class User {
  private constructor(
    public readonly id: bigint,
    public readonly uid: string,
    private authInfo: UserAuth,
    private location: UserLocation,
    public readonly status: PrismaUserStatus,
    public readonly role: UserRoleType,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   * Repository에서 Prisma를 통해 생성/조회된 데이터를 Domain Entity로 변환할 때 사용
   */
  static fromPersistence(data: {
    id: bigint;
    uid: string;
    email: string;
    passwordHash: string | null;
    socialId: string | null;
    socialType: SocialType | null;
    status: PrismaUserStatus;
    role: UserRoleType;
    country: string | null;
    timezone: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      data.id,
      data.uid,
      UserAuth.fromPersistence({
        email: data.email,
        passwordHash: data.passwordHash,
        socialId: data.socialId,
        socialType: data.socialType,
      }),
      UserLocation.fromPersistence({
        country: data.country,
        timezone: data.timezone,
      }),
      data.status,
      data.role,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * Domain 엔티티를 Persistence 레이어로 변환
   */
  toPersistence(): {
    id: bigint;
    uid: string;
    email: string;
    passwordHash: string | null;
    socialId: string | null;
    socialType: SocialType | null;
    status: PrismaUserStatus;
    role: UserRoleType;
    country: string | null;
    timezone: string | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    const auth = this.authInfo.toPersistence();
    const location = this.location.toPersistence();

    return {
      id: this.id,
      uid: this.uid,
      email: auth.email,
      passwordHash: auth.passwordHash,
      socialId: auth.socialId,
      socialType: auth.socialType,
      status: this.status,
      role: this.role,
      country: location.country,
      timezone: location.timezone,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Getters (Value Object 접근)

  /**
   * 이메일 조회 (자주 사용되므로 편의 메서드 제공)
   */
  get email(): string {
    return this.authInfo.email;
  }

  /**
   * 인증 정보 조회
   */
  getAuthInfo(): UserAuth {
    return this.authInfo;
  }

  // Business Logic Methods

  /**
   * 일반 회원가입 사용자인지 확인
   */
  isCredentialUser(): boolean {
    return this.authInfo.isCredentialUser();
  }

  /**
   * 소셜 회원가입 사용자인지 확인
   */
  isSocialUser(): boolean {
    return this.authInfo.isSocialUser();
  }

  /**
   * 사용자 타입이 유효한지 확인
   */
  hasValidUserType(): boolean {
    return this.authInfo.hasValidUserType();
  }

  /**
   * 위치 정보 조회
   */
  getLocation(): UserLocation {
    return this.location;
  }

  // 추후 확장 예정 메서드들 (주석 처리)
  /*
  // 프로필 관리 (추후 구현)
  updateProfile(newProfile: Partial<UserProfile>): void {
    this.profile = this.profile.update(newProfile);
  }

  // 계정 상태 관리 (추후 구현)
  suspend(reason: string): void {
    this.status = this.status.toSuspended(reason);
  }

  activate(): void {
    this.status = this.status.toActive();
  }

  deactivate(): void {
    this.status = this.status.toDeactivated();
  }

  // 위치 정보 업데이트 (추후 구현)
  updateLocation(updates: Partial<{
    country: string | null;
    timezone: string | null;
  }>): void {
    this.location = this.location.update(updates);
  }
  */
}

