import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5000,
            },
        },
    })

    // Vue 인스턴스에 플러그인 직접 등록
    nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })
})