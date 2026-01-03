import { AffiliateCode } from './model/affiliate-code.entity';
import {
  AffiliateCodeLimitExceededException,
  AffiliateCodeCannotDeleteException,
  AffiliateCodeDefaultMustExistException,
  AffiliateCodeDefaultCannotBeInactiveException,
} from './affiliate-code.exception';

const MAX_CODES_PER_USER = 20;

/**
 * 어플리에이트 코드 도메인 정책 (Policy)
 * 비즈니스 규칙과 검증 로직을 담당
 */
export class AffiliateCodePolicy {
  /**
   * 새 코드 생성 가능 여부 검증 (개수 제한만 체크)
   * 코드 형식 검증은 코드 생성 시 자동으로 수행됨
   * 코드 중복 체크는 Application 레이어에서 전체 시스템 기준으로 수행
   */
  canCreateCode(currentCodeCount: number): void {
    // 개수 제한 체크
    if (currentCodeCount >= MAX_CODES_PER_USER) {
      throw new AffiliateCodeLimitExceededException(MAX_CODES_PER_USER);
    }
  }

  /**
   * 첫 번째 코드인지 확인
   */
  isFirstCode(currentCodeCount: number): boolean {
    return currentCodeCount === 0;
  }

  /**
   * 코드 삭제 가능 여부 검증
   */
  canDeleteCode(code: AffiliateCode, totalCodes: number): void {
    if (!code.canBeDeleted(totalCodes)) {
      throw new AffiliateCodeCannotDeleteException();
    }
  }

  /**
   * 기본 코드 상태 변경 가능 여부 검증
   * 기본 코드는 직접 해제할 수 없음 (다른 코드를 기본으로 설정하여 변경해야 함)
   */
  canUnsetDefault(code: AffiliateCode): void {
    if (code.isDefault) {
      throw new AffiliateCodeDefaultMustExistException();
    }
  }

  /**
   * 활성화 상태 변경 가능 여부 검증
   * 기본 코드는 비활성화할 수 없음
   */
  canDeactivate(code: AffiliateCode): void {
    if (code.isDefault) {
      throw new AffiliateCodeDefaultCannotBeInactiveException();
    }
  }

  /**
   * 최대 코드 개수 반환
   */
  getMaxCodesPerUser(): number {
    return MAX_CODES_PER_USER;
  }
}
