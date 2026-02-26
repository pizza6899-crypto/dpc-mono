// src/modules/user/ports/out/user.repository.port.ts
import type { User } from '../../domain';
import type { UserRoleType, SocialType, UserStatus, ExchangeCurrencyCode } from '@prisma/client';


/**
 * User 생성 파라미터
 *
 * 도메인 관점에서 필요한 정보만 포함합니다.
 */
export interface CreateUserParams {
  email: string;
  passwordHash: string | null;
  socialId: string | null;
  socialType: SocialType | null;
  role: UserRoleType;
  country: string | null;
  timezone: string | null;
  primaryCurrency?: ExchangeCurrencyCode;
  playCurrency?: ExchangeCurrencyCode;
}

/**
 * User 목록 조회 필터
 */
export interface FindUsersParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'email';
  sortOrder?: 'asc' | 'desc';
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
   * 소셜 ID로 사용자 조회
   */
  findBySocialId(socialId: string): Promise<User | null>;

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
}
