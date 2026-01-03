import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import duration from 'dayjs/plugin/duration'

export default defineNuxtPlugin(() => {
    dayjs.extend(relativeTime)
    dayjs.extend(utc)
    dayjs.extend(timezone)
    dayjs.extend(duration)

    // 기본 타임존 설정 (필요시 수정)
    // dayjs.tz.setDefault('Asia/Seoul')

    return {
        provide: {
            dayjs
        }
    }
})
