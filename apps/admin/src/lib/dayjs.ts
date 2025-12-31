import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import isSameOrBeforePlugin from "dayjs/plugin/isSameOrBefore";
import isSameOrAfterPlugin from "dayjs/plugin/isSameOrAfter";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/ko";

// 플러그인 등록
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(isSameOrBeforePlugin);
dayjs.extend(isSameOrAfterPlugin);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

// 기본 로케일을 한국어로 설정
dayjs.locale("ko");

// 기본 타임존 설정 (필요시 변경)
// dayjs.tz.setDefault("Asia/Seoul");

export default dayjs;

