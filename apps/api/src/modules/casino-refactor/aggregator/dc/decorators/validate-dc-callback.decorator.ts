import { SetMetadata } from '@nestjs/common';

/**
 * DC 콜백 검증 메타데이터 키
 */
export const VALIDATE_DC_CALLBACK_KEY = 'validateDcCallback';

/**
 * DC 콜백 검증 메타데이터 인터페이스
 */
export interface ValidateDcCallbackMetadata {
  /**
   * 필수 필드 목록
   */
  requiredFields: string[];
  /**
   * 서명 검증에 사용할 파라미터들 (순서 중요)
   * 예: ['token'] 또는 ['wager_id'] 또는 ['promotion_id', 'trans_id']
   */
  signParams: string[];
}

/**
 * DC 콜백 검증 데코레이터
 *
 * @param requiredFields - 필수 필드 목록
 * @param signParams - 서명 검증에 사용할 파라미터들 (순서 중요)
 *
 * @example
 * ```typescript
 * @ValidateDcCallback(['brand_id', 'sign', 'token', 'brand_uid', 'currency'], ['token'])
 * async login(@Body() body: DcLoginRequestDto) { ... }
 * ```
 */
export const ValidateDcCallback = (
  requiredFields: string[],
  signParams: string[],
) => SetMetadata(VALIDATE_DC_CALLBACK_KEY, { requiredFields, signParams });

