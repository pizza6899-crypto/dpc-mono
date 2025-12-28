import type { RegistrationUser } from '../../domain';
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
 * 회원가입 과정에서 필요한 사용자 조회 및 생성 기능을 정의합니다.
 */
export interface UserRepositoryPort {
  /**
   * 이메일로 사용자 조회
   */
  findByEmail(email: string): Promise<RegistrationUser | null>;

  /**
   * 소셜 ID로 사용자 조회
   */
  findBySocialId(socialId: string): Promise<RegistrationUser | null>;

  /**
   * 새 사용자 생성
   */
  create(params: CreateUserParams): Promise<RegistrationUser>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
