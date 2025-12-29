// src/modules/user/ports/out/user.repository.port.ts
import type { User } from '../../domain';
import type { UserRoleType, SocialType } from '@repo/database';

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
   * UID로 사용자 조회
   */
  findByUid(uid: string): Promise<User | null>;

  /**
   * 새 사용자 생성
   */
  create(params: CreateUserParams): Promise<User>;
}

