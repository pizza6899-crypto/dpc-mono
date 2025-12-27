import { DateTime, DurationLike } from 'luxon';

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
 * 현재 UTC 시간을 지정된 형식의 문자열로 반환
 * @param format Luxon 형식 문자열 (예: 'yyyy-MM-dd', 'yyyy-MM-dd HH:mm:ss')
 */
export function nowUtcFormatted(format: string): string {
  return DateTime.utc().toFormat(format);
}

/**
 * 현재 UTC 시간에 지정된 기간을 더한 Date 객체 반환
 * @param duration 더할 기간 (예: { days: 1 }, { hours: 2, minutes: 30 })
 */
export function nowUtcPlus(duration: DurationLike): Date {
  return DateTime.utc().plus(duration).toJSDate();
}

/**
 * 현재 UTC 시간에서 지정된 기간을 뺀 Date 객체 반환
 * @param duration 뺄 기간 (예: { days: 1 }, { hours: 2, minutes: 30 })
 */
export function nowUtcMinus(duration: DurationLike): Date {
  return DateTime.utc().minus(duration).toJSDate();
}

/**
 * ISO 문자열을 UTC Date로 파싱
 * @param isoString ISO 형식의 날짜 문자열
 */
export function parseIsoToDate(isoString: string): Date {
  return DateTime.fromISO(isoString, { zone: 'utc' }).toJSDate();
}

/**
 * Date를 ISO 문자열(UTC)로 변환
 * @param date 변환할 Date 객체
 */
export function toIsoStringUtc(date: Date): string {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toISO() ?? '';
}

/**
 * Date를 지정된 형식의 문자열로 변환 (UTC 기준)
 * @param date 변환할 Date 객체
 * @param format Luxon 형식 문자열 (예: 'yyyy-MM-dd', 'yyyy-MM-dd HH:mm:ss')
 */
export function formatDateUtc(date: Date, format: string): string {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat(format);
}

/**
 * Date를 'yyyy-MM-dd' 형식(UTC) 문자열로 변환
 * @param date 변환할 Date 객체
 */
export function formatDateYMD(date: Date): string {
  return formatDateUtc(date, 'yyyy-MM-dd');
}

/**
 * Date를 'yyyy-MM-dd HH:mm:ss' 형식(UTC) 문자열로 변환
 * @param date 변환할 Date 객체
 */
export function formatDateYMDHMS(date: Date): string {
  return formatDateUtc(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 두 날짜 사이의 차이를 DurationLike 객체로 반환
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 */
export function diffDates(startDate: Date, endDate: Date): DurationLike {
  const start = DateTime.fromJSDate(startDate, { zone: 'utc' });
  const end = DateTime.fromJSDate(endDate, { zone: 'utc' });
  return end.diff(start).toObject();
}

/**
 * 두 날짜 사이의 일수 차이를 반환
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 */
export function diffInDays(startDate: Date, endDate: Date): number {
  const start = DateTime.fromJSDate(startDate, { zone: 'utc' });
  const end = DateTime.fromJSDate(endDate, { zone: 'utc' });
  return Math.floor(end.diff(start, 'days').days);
}

/**
 * 두 날짜 사이의 시간 차이를 반환
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 */
export function diffInHours(startDate: Date, endDate: Date): number {
  const start = DateTime.fromJSDate(startDate, { zone: 'utc' });
  const end = DateTime.fromJSDate(endDate, { zone: 'utc' });
  return Math.floor(end.diff(start, 'hours').hours);
}

/**
 * 날짜가 유효한지 확인
 * @param date 확인할 Date 객체
 */
export function isValidDate(date: Date): boolean {
  return DateTime.fromJSDate(date).isValid;
}

/**
 * 문자열이 유효한 ISO 날짜 형식인지 확인
 * @param dateString 확인할 문자열
 */
export function isValidIsoDate(dateString: string): boolean {
  return DateTime.fromISO(dateString).isValid;
}

/**
 * 오늘 날짜의 시작 시간 (00:00:00)을 UTC로 반환
 */
export function todayStartUtc(): Date {
  return DateTime.utc().startOf('day').toJSDate();
}

/**
 * 오늘 날짜의 끝 시간 (23:59:59.999)을 UTC로 반환
 */
export function todayEndUtc(): Date {
  return DateTime.utc().endOf('day').toJSDate();
}

/**
 * 특정 날짜의 시작 시간 (00:00:00)을 UTC로 반환
 * @param date 기준 날짜
 */
export function dateStartUtc(date: Date): Date {
  return DateTime.fromJSDate(date, { zone: 'utc' }).startOf('day').toJSDate();
}

/**
 * 특정 날짜의 끝 시간 (23:59:59.999)을 UTC로 반환
 * @param date 기준 날짜
 */
export function dateEndUtc(date: Date): Date {
  return DateTime.fromJSDate(date, { zone: 'utc' }).endOf('day').toJSDate();
}

/**
 * 현재 시간이 지정된 시간 범위 내에 있는지 확인
 * @param startTime 시작 시간
 * @param endTime 종료 시간
 */
export function isTimeInRange(startTime: Date, endTime: Date): boolean {
  const now = nowUtc();
  return now >= startTime && now <= endTime;
}

/**
 * 날짜 비교 함수들
 */
export const dateCompare = {
  /**
   * 첫 번째 날짜가 두 번째 날짜보다 이전인지 확인
   */
  isBefore: (date1: Date, date2: Date): boolean => {
    return (
      DateTime.fromJSDate(date1, { zone: 'utc' }) <
      DateTime.fromJSDate(date2, { zone: 'utc' })
    );
  },

  /**
   * 첫 번째 날짜가 두 번째 날짜보다 이후인지 확인
   */
  isAfter: (date1: Date, date2: Date): boolean => {
    return (
      DateTime.fromJSDate(date1, { zone: 'utc' }) >
      DateTime.fromJSDate(date2, { zone: 'utc' })
    );
  },

  /**
   * 두 날짜가 같은지 확인 (밀리초 단위까지)
   */
  isEqual: (date1: Date, date2: Date): boolean => {
    return DateTime.fromJSDate(date1, { zone: 'utc' }).equals(
      DateTime.fromJSDate(date2, { zone: 'utc' }),
    );
  },

  /**
   * 첫 번째 날짜가 두 번째 날짜와 같거나 이전인지 확인
   */
  isSameOrBefore: (date1: Date, date2: Date): boolean => {
    return (
      DateTime.fromJSDate(date1, { zone: 'utc' }) <=
      DateTime.fromJSDate(date2, { zone: 'utc' })
    );
  },

  /**
   * 첫 번째 날짜가 두 번째 날짜와 같거나 이후인지 확인
   */
  isSameOrAfter: (date1: Date, date2: Date): boolean => {
    return (
      DateTime.fromJSDate(date1, { zone: 'utc' }) >=
      DateTime.fromJSDate(date2, { zone: 'utc' })
    );
  },
};

/**
 * 다양한 형식의 시간 문자열을 UTC Date 객체로 변환
 * 지원 형식:
 * - ISO 형식: "2024-01-01T00:00:00Z", "2024-01-01T00:00:00.000Z"
 * - 날짜만: "2024-01-01"
 * - 날짜+시간: "2024-01-01 00:00:00", "2024-01-01 00:00:00.000"
 * - RFC 2822: "Mon, 01 Jan 2024 00:00:00 GMT"
 * - 기타 Luxon이 파싱 가능한 형식
 *
 * @param dateString 변환할 날짜/시간 문자열
 * @returns UTC Date 객체, 파싱 실패 시 null
 */
export function parseDateString(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // ISO 형식 시도 (가장 일반적)
  let dt = DateTime.fromISO(dateString, { zone: 'utc' });
  if (dt.isValid) {
    return dt.toJSDate();
  }

  // RFC 2822 형식 시도
  dt = DateTime.fromRFC2822(dateString, { zone: 'utc' });
  if (dt.isValid) {
    return dt.toJSDate();
  }

  // SQL 형식 (YYYY-MM-DD HH:mm:ss) 시도
  dt = DateTime.fromSQL(dateString, { zone: 'utc' });
  if (dt.isValid) {
    return dt.toJSDate();
  }

  // 일반 파싱 시도 (자동 감지)
  dt = DateTime.fromFormat(dateString, 'yyyy-MM-dd HH:mm:ss', { zone: 'utc' });
  if (dt.isValid) {
    return dt.toJSDate();
  }

  dt = DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone: 'utc' });
  if (dt.isValid) {
    return dt.toJSDate();
  }

  // 마지막으로 JavaScript Date 파싱 시도
  const jsDate = new Date(dateString);
  if (!isNaN(jsDate.getTime())) {
    return DateTime.fromJSDate(jsDate, { zone: 'utc' }).toJSDate();
  }

  return null;
}

/**
 * 다양한 형식의 시간 문자열을 UTC Date 객체로 변환 (에러 발생 시 예외 던짐)
 * @param dateString 변환할 날짜/시간 문자열
 * @throws Error 파싱 실패 시
 */
export function parseDateStringOrThrow(dateString: string): Date {
  const date = parseDateString(dateString);
  if (!date) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}
