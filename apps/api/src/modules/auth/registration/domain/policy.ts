import { Injectable } from '@nestjs/common';
import type { RegistrationUser } from './model/registration-user.entity';

/**
 * Registration 도메인 정책
 *
 * 회원가입 관련 비즈니스 규칙을 담당합니다.
 */
@Injectable()
export class RegistrationPolicy {
  /**
   * 이메일 중복 가입 방지 정책
   * @param existingUser - 기존 사용자 존재 여부
   * @returns 중복 가입이면 true, 아니면 false
   */
  isDuplicateEmail(existingUser: RegistrationUser | null): boolean {
    return existingUser !== null;
  }

  /**
   * 소셜 계정 중복 가입 방지 정책
   * @param existingUser - 기존 사용자 존재 여부
   * @returns 중복 가입이면 true, 아니면 false
   */
  isDuplicateSocialAccount(existingUser: RegistrationUser | null): boolean {
    return existingUser !== null;
  }

  /**
   * 회원가입 가능 여부 확인
   * @param existingUser - 기존 사용자
   * @returns 회원가입 가능하면 true, 아니면 false
   */
  canRegister(existingUser: RegistrationUser | null): boolean {
    return existingUser === null;
  }
}

