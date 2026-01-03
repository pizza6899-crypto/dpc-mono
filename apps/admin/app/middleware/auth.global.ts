export default defineNuxtRouteMiddleware(async (to) => {
    const authStore = useAuthStore()

    // 1. 로그인 페이지 처리
    if (to.path === '/login') {
        // 이미 로그인된 경우 홈으로 이동
        if (authStore.isLoggedIn) {
            return navigateTo('/')
        }
        return
    }

    // 2. 초기 로드 시 인증 상태 확인 (새로고침 등)
    if (!authStore.isInitialized) {
        await authStore.fetchUserStatus()
    }

    // 3. 인증되지 않은 경우 로그인 페이지로 이동
    if (!authStore.isLoggedIn) {
        return navigateTo('/login')
    }
})
