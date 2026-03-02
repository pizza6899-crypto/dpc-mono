import { SetMetadata } from '@nestjs/common';
import type { Action, Subjects } from '../domain';

/**
 * 권한 검증 메타데이터 키
 */
export const CHECK_ABILITY_KEY = 'checkAbility';

/**
 * 권한 검증 인터페이스
 */
export interface CheckAbilityMetadata {
  action: Action;
  subject: Subjects;
}

/**
 * 권한 검증 데코레이터
 *
 * @param action - 허용할 액션
 * @param subject - 대상 리소스 타입
 * @returns 메타데이터 데코레이터
 *
 * @example
 * ```typescript
 * @CheckAbility(Action.UPDATE, SubjectType.USER)
 * async updateUser() { ... }
 * ```
 */
export const CheckAbility = (action: Action, subject: Subjects) =>
  SetMetadata(CHECK_ABILITY_KEY, { action, subject });
