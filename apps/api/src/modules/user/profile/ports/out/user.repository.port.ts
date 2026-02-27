// src/modules/user/profile/ports/out/user.repository.port.ts
import type { User } from '../../domain';
import type { UserRoleType, OAuthProvider, UserStatus, ExchangeCurrencyCode, RegistrationMethod } from '@prisma/client';

/**
 * User 생성 파라미터
 * 도메인 관점에서 필요한 정보만 포함합니다.
 */
export interface CreateUserParams {
  loginId: string | null;
  nickname: string;
  email?: string | null;
  passwordHash?: string | null;
  registrationMethod?: RegistrationMethod;
  telegramUsername?: string | null;
  oauthProvider?: OAuthProvider | null;
  oauthId?: string | null;
  phoneNumber?: string | null;
  role?: UserRoleType;
  status?: UserStatus;
  country?: string | null;
  language?: any; // Language enum 참조가 필요할 수 있음
  timezone?: string | null;
  timezoneOffset?: number | null;
  primaryCurrency?: ExchangeCurrencyCode;
  playCurrency?: ExchangeCurrencyCode;
}

/**
 * User 목록 조회 필터
 */
export interface FindUsersParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'loginId' | 'nickname';
  sortOrder?: 'asc' | 'desc';
  loginId?: string;
  nickname?: string;
  email?: string;
  role?: UserRoleType;
  status?: UserStatus;
  startDate?: Date;
  endDate?: Date;
}

/**
 * User 목록 조회 결과
 */
export interface FindUsersResult {
  users: User[];
  total: number;
}

/**
 * User Repository Port
 *
 * 사용자 조회 및 생성 기능을 정의합니다.
 */
export interface UserRepositoryPort {
  /**
   * 이메일로 사용자 조회
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * 로그인 ID로 사용자 조회
   */
  findByLoginId(loginId: string): Promise<User | null>;

  /**
   * 닉네임으로 사용자 조회
   */
  findByNickname(nickname: string): Promise<User | null>;

  /**
   * OAuth ID로 사용자 조회
   */
  findByOAuthId(provider: OAuthProvider, oauthId: string): Promise<User | null>;

  /**
   * ID로 사용자 조회
   */
  findById(id: bigint): Promise<User | null>;

  /**
   * 사용자 목록 조회 (페이징, 필터링 지원)
   */
  findMany(params: FindUsersParams): Promise<FindUsersResult>;

  /**
   * 새 사용자 생성
   */
  create(params: CreateUserParams): Promise<User>;

  /**
   * 사용자 비밀번호 업데이트
   */
  updatePassword(userId: bigint, passwordHash: string): Promise<User>;

  /**
   * 도메인 엔티티를 활용한 영속화 저장 (생성/수정 통합)
   * 현재는 update 쿼리를 위해 사용됩니다.
   */
  save(user: User): Promise<User>;
}
