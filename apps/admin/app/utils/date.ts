import dayjs from 'dayjs'

/**
 * 기본 날짜 포맷 (YYYY-MM-DD HH:mm:ss)
 */
export const formatDate = (date?: string | number | Date | null, format = 'YYYY-MM-DD HH:mm:ss') => {
    if (!date) return '-'
    return dayjs(date).format(format)
}

/**
 * 짧은 날짜 포맷 (YYYY-MM-DD)
 */
export const formatShortDate = (date?: string | number | Date | null) => {
    return formatDate(date, 'YYYY-MM-DD')
}

/**
 * 상대 시간 (방금 전, 1시간 전 등)
 */
export const formatRelativeTime = (date?: string | number | Date | null) => {
    if (!date) return '-'
    return dayjs(date).fromNow()
}
