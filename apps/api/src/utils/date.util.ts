import type { DurationLike } from 'luxon';
import { DateTime } from 'luxon';

/**
 * Date 유틸리티 함수 모음
 * 모든 함수는 UTC 기준으로 동작합니다.
 */

/**
 * 현재 UTC 시간을 Date 객체로 반환
 */
export function nowUtc(): Date {
  return DateTime.utc().toJSDate();
}

/**
 * 현재 UTC 시간을 ISO 문자열로 반환
 */
export function nowUtcIso(): string {
  return DateTime.utc().toISO();
}

/**
 * 현재 UTC 시간에서 지정된 기간을 뺀 Date 객체 반환
 * @param duration 뺄 기간 (예: { days: 1 }, { hours: 2, minutes: 30 })
 */
export function nowUtcMinus(duration: DurationLike): Date {
  return DateTime.utc().minus(duration).toJSDate();
}
