// src/platform/http/decorators/transform-boolean.decorator.ts
import { Transform } from 'class-transformer';

/**
 * 쿼리 파라미터의 문자열 'true'/'false'를 boolean으로 변환하는 데코레이터
 *
 * @example
 * ```typescript
 * class MyDto {
 *   @TransformToBoolean()
 *   @IsOptional()
 *   @IsBoolean()
 *   isActive?: boolean;
 * }
 * ```
 *
 * 쿼리 파라미터로 `?isActive=true` 또는 `?isActive=false`를 받으면
 * 자동으로 boolean 타입으로 변환됩니다.
 */
export const TransformToBoolean = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null) {
      return value;
    }
    // 문자열 'true' 또는 실제 boolean true를 boolean true로 변환
    if (value === 'true' || value === true) {
      return true;
    }
    // 문자열 'false' 또는 실제 boolean false를 boolean false로 변환
    if (value === 'false' || value === false) {
      return false;
    }
    // 그 외의 경우는 원래 값 반환 (validation에서 처리)
    return value;
  });
