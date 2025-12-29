// src/modules/user/domain/user-policy.ts
import type { User } from './model/user.entity';
import { UserAlreadyExistsException, UserNotFoundException } from './user.exception';

/**
 * User 도메인 정책 (Policy)
 * 비즈니스 규칙과 검증 로직을 담당합니다.
 */
export class UserPolicy {
  /**
   * 사용자 생성 가능 여부 검증
   * @param existingUser - 기존 사용자 (없으면 null)
   * @throws {UserAlreadyExistsException} 이미 존재하는 사용자인 경우
   */
  canCreateUser(existingUser: User | null): void {
    if (existingUser) {
      throw new UserAlreadyExistsException(existingUser.email);
    }
  }

  /**
   * 사용자 조회 가능 여부 검증
   * @param user - 조회한 사용자 (없으면 null)
   * @param identifier - 사용자 식별자 (에러 메시지용)
   * @throws {UserNotFoundException} 사용자를 찾을 수 없는 경우
   */
  canAccessUser(user: User | null, identifier?: string | bigint): void {
    if (!user) {
      const id = identifier || 'unknown';
      throw new UserNotFoundException(id);
    }
  }
}

