// app/middleware/auth.global.ts (파일명에 .global을 붙이면 모든 페이지에 자동 적용됩니다)
export default defineNuxtRouteMiddleware((to) => {
    const authStore = useAuthStore();

    // 1. 공개 페이지 정의 (필요 시 회원가입, 비밀번호 찾기 등 추가)
    const publicPages = ['/login'];
    const isPublicPage = publicPages.includes(to.path);

    // 2. 인증이 필요한데 로그인이 안 된 경우
    if (!isPublicPage && !authStore.isLoggedIn) {
        // 로그인 후 원래 가려던 페이지로 돌아오게 하려면 query를 활용하세요
        return navigateTo({
            path: '/login',
            query: { redirect: to.fullPath }
        });
    }

    // 3. 이미 로그인했는데 로그인 페이지로 가려는 경우 -> 메인으로 이동
    if (to.path === '/login' && authStore.isLoggedIn) {
        return navigateTo('/');
    }
});