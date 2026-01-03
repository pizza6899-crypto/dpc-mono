import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// 필요한 로케일 파일들을 미리 import
import 'dayjs/locale/ko'
import 'dayjs/locale/en'

export default defineNuxtPlugin((nuxtApp) => {
    // 1. 기능 확장
    dayjs.extend(utc)
    dayjs.extend(timezone)
    dayjs.extend(relativeTime)

    // 2. i18n 인스턴스 가져오기
    // Nuxt i18n은 nuxtApp.$i18n으로 접근 가능합니다.
    const { locale } = nuxtApp.$i18n

    // 3. 언어 변경 감시 및 적용 함수
    const setDayjsLocale = (lang: string) => {
        // i18n 언어 코드를 dayjs 형식에 맞게 변환 (예: en-US -> en)
        const dayjsLocale = lang.split('-')[0]
        dayjs.locale(dayjsLocale)
    }

    // 초기 설정
    setDayjsLocale(locale.value)

    // i18n 언어가 바뀔 때마다 dayjs 로케일도 업데이트
    watch(locale, (newLocale) => {
        setDayjsLocale(newLocale)
    }, { immediate: true })

    return {
        provide: {
            dayjs: dayjs
        }
    }
})