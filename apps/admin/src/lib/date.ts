import dayjs from "./dayjs";

/**
 * 날짜 유틸리티 함수들
 */

/**
 * 현재 날짜/시간을 dayjs 객체로 반환
 */
export const now = () => dayjs();

/**
 * 날짜를 dayjs 객체로 변환
 */
export const toDayjs = (date?: string | number | Date | dayjs.Dayjs | null) => {
  if (!date) return dayjs();
  return dayjs(date);
};

/**
 * 날짜를 ISO 문자열로 변환
 */
export const toISOString = (date?: string | number | Date | dayjs.Dayjs | null) => {
  if (!date) return dayjs().toISOString();
  return dayjs(date).toISOString();
};

/**
 * 날짜를 포맷된 문자열로 변환
 * @param date - 변환할 날짜
 * @param format - 포맷 문자열 (기본값: "YYYY-MM-DD HH:mm:ss")
 */
export const format = (
  date?: string | number | Date | dayjs.Dayjs | null,
  formatStr = "YYYY-MM-DD HH:mm:ss"
) => {
  if (!date) return "";
  return dayjs(date).format(formatStr);
};

/**
 * 날짜를 한국어 형식으로 포맷
 * @param date - 변환할 날짜
 * @param formatStr - 포맷 문자열 (기본값: "YYYY년 MM월 DD일 HH:mm")
 */
export const formatKo = (
  date?: string | number | Date | dayjs.Dayjs | null,
  formatStr = "YYYY년 MM월 DD일 HH:mm"
) => {
  if (!date) return "";
  return dayjs(date).format(formatStr);
};

/**
 * 날짜를 상대 시간으로 표시 (예: "2시간 전", "3일 후")
 */
export const fromNow = (date?: string | number | Date | dayjs.Dayjs | null) => {
  if (!date) return "";
  return dayjs(date).fromNow();
};

/**
 * 날짜를 상대 시간으로 표시 (예: "2시간 전", "3일 후") - 한국어
 */
export const fromNowKo = (date?: string | number | Date | dayjs.Dayjs | null) => {
  if (!date) return "";
  return dayjs(date).locale("ko").fromNow();
};

/**
 * 날짜 차이 계산 (밀리초)
 */
export const diff = (
  date1: string | number | Date | dayjs.Dayjs,
  date2?: string | number | Date | dayjs.Dayjs | null,
  unit: dayjs.UnitType = "millisecond"
) => {
  if (!date2) {
    date2 = dayjs();
  }
  return dayjs(date1).diff(dayjs(date2), unit);
};

/**
 * 날짜가 유효한지 확인
 */
export const isValid = (date?: string | number | Date | dayjs.Dayjs | null) => {
  if (!date) return false;
  return dayjs(date).isValid();
};

/**
 * 날짜 범위 확인
 */
export const isBetween = (
  date: string | number | Date | dayjs.Dayjs,
  start: string | number | Date | dayjs.Dayjs,
  end: string | number | Date | dayjs.Dayjs,
  unit?: dayjs.UnitType,
  inclusivity?: "()" | "[)" | "(]" | "[]"
) => {
  return dayjs(date).isBetween(start, end, unit, inclusivity);
};

/**
 * 날짜가 같은지 또는 이전인지 확인
 */
export const isSameOrBeforeDate = (
  date1: string | number | Date | dayjs.Dayjs,
  date2?: string | number | Date | dayjs.Dayjs | null,
  unit?: dayjs.UnitType
) => {
  if (!date2) {
    date2 = dayjs();
  }
  return dayjs(date1).isSameOrBefore(dayjs(date2), unit);
};

/**
 * 날짜가 같은지 또는 이후인지 확인
 */
export const isSameOrAfterDate = (
  date1: string | number | Date | dayjs.Dayjs,
  date2?: string | number | Date | dayjs.Dayjs | null,
  unit?: dayjs.UnitType
) => {
  if (!date2) {
    date2 = dayjs();
  }
  return dayjs(date1).isSameOrAfter(dayjs(date2), unit);
};

/**
 * Date 객체로 변환
 */
export const toDate = (date?: string | number | Date | dayjs.Dayjs | null) => {
  if (!date) return new Date();
  return dayjs(date).toDate();
};

/**
 * 타임존 변환
 */
export const toTimezone = (
  date: string | number | Date | dayjs.Dayjs,
  timezone: string = "Asia/Seoul"
) => {
  return dayjs(date).tz(timezone);
};

/**
 * 일반적인 날짜 포맷들
 */
export const dateFormats = {
  date: "YYYY-MM-DD",
  datetime: "YYYY-MM-DD HH:mm:ss",
  time: "HH:mm:ss",
  dateKo: "YYYY년 MM월 DD일",
  datetimeKo: "YYYY년 MM월 DD일 HH:mm",
  dateTimeShort: "YYYY-MM-DD HH:mm",
} as const;

