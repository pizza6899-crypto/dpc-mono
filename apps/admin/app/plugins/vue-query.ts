import { defineNuxtPlugin } from '#app'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
    // 1. 전역 쿼리 클라이언트 생성
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                // 백오피스 특성에 맞춘 기본 설정
                retry: 1,                    // 실패 시 1번 더 시도
                refetchOnWindowFocus: false, // 창 다시 클릭했을 때 자동 새로고침 방지
                staleTime: 5 * 1000,         // 5초 동안은 '신선한' 데이터로 간주
            },
        },
    })

    // 2. Nuxt 앱에 Vue Query 연결
    nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })

    return {
        provide: {
            queryClient,
        },
    }
})