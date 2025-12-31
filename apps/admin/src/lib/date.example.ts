/**
 * dayjs 사용 예시
 * 
 * 이 파일은 참고용 예시입니다. 실제 사용 시에는 @/lib/date에서 함수를 import하세요.
 */

import dayjs from "@/lib/dayjs";
import {
  format,
  formatKo,
  fromNowKo,
  toISOString,
  toDayjs,
  now,
  isValid,
  isBetween,
  isSameOrBeforeDate,
  isSameOrAfterDate,
  dateFormats,
} from "@/lib/date";

// ===== 기본 사용법 =====

// 현재 시간
const current = now();
console.log(current.format("YYYY-MM-DD HH:mm:ss")); // "2024-01-01 12:00:00"

// 날짜 포맷팅
const formatted = format(new Date(), "YYYY-MM-DD");
console.log(formatted); // "2024-01-01"

// 한국어 포맷팅
const formattedKo = formatKo(new Date());
console.log(formattedKo); // "2024년 01월 01일 12:00"

// 상대 시간
const relative = fromNowKo(new Date(Date.now() - 3600000));
console.log(relative); // "1시간 전"

// 상대 시간 (영어)
const relativeEn = dayjs(new Date(Date.now() - 3600000)).fromNow();
console.log(relativeEn); // "an hour ago"

// ISO 문자열 변환
const iso = toISOString(new Date());
console.log(iso); // "2024-01-01T12:00:00.000Z"

// ===== 날짜 비교 =====

const date1 = toDayjs("2024-01-01");
const date2 = toDayjs("2024-01-15");

// 날짜가 유효한지 확인
if (isValid(date1)) {
  console.log("유효한 날짜입니다");
}

// 날짜 범위 확인
if (isBetween(date1, "2024-01-01", "2024-01-31")) {
  console.log("범위 내에 있습니다");
}

// 날짜 비교
if (isSameOrBeforeDate(date1, date2)) {
  console.log("date1이 date2보다 같거나 이전입니다");
}

if (isSameOrAfterDate(date1, date2)) {
  console.log("date1이 date2보다 같거나 이후입니다");
}

// ===== 포맷 상수 사용 =====

const date = new Date();
console.log(format(date, dateFormats.date)); // "2024-01-01"
console.log(format(date, dateFormats.datetime)); // "2024-01-01 12:00:00"
console.log(format(date, dateFormats.dateKo)); // "2024년 01월 01일"

// ===== 직접 dayjs 사용 =====

// dayjs 객체 직접 사용
const dayjsDate = dayjs("2024-01-01");
console.log(dayjsDate.add(1, "day").format("YYYY-MM-DD")); // "2024-01-02"
console.log(dayjsDate.subtract(1, "month").format("YYYY-MM-DD")); // "2023-12-01"

// 타임존 변환
const seoulTime = dayjs.tz("2024-01-01 12:00:00", "Asia/Seoul");
console.log(seoulTime.format()); // "2024-01-01T12:00:00+09:00"

