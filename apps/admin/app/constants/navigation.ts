export interface NavItem {
    label: string
    labelKey?: string // i18n key
    icon?: string
    to?: string
    children?: NavItem[]
    badge?: string | number
    roles?: string[] // 해당 메뉴를 볼 수 있는 권한 (설정되지 않으면 모두 허용)
}

/**
 * 어드민 메뉴 구성
 * roles: 허용할 권한 목록 (나중에 CASL 도입 시 이 구조를 기반으로 확장 가능)
 */
export const NAVIGATION_ITEMS: NavItem[] = [
    {
        label: '대시보드',
        labelKey: 'dashboard',
        icon: 'i-heroicons-home',
        to: '/dashboard',
        roles: ['ADMIN', 'MANAGER']
    },
    {
        label: '회원 관리',
        labelKey: 'users',
        icon: 'i-heroicons-users',
        roles: ['ADMIN'], // 어드민만 접근 가능
        children: [
            { label: '전체 회원', to: '/users' },
            { label: '차단 회원', to: '/users/prohibited' }
        ]
    },
    {
        label: '입출금 관리',
        labelKey: 'payments',
        icon: 'i-heroicons-banknotes',
        roles: ['ADMIN', 'MANAGER'],
        children: [
            { label: '입금 신청', to: '/payments/deposits', badge: 5 },
            { label: '출금 신청', to: '/payments/withdrawals' }
        ]
    },
    {
        label: '시스템 설정',
        labelKey: 'settings',
        icon: 'i-heroicons-cog-6-tooth',
        to: '/settings',
        roles: ['ADMIN'] // 어드민 전용
    }
]
