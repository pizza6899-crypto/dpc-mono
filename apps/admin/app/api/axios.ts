import axios, { type AxiosRequestConfig, type AxiosError } from 'axios'
import { useAuthStore } from '~/stores/auth'

// 1. axios 인스턴스 생성
export const AXIOS_INSTANCE = axios.create({
    timeout: 10000,
    withCredentials: true, // 💡 중요: 이 옵션이 있어야 쿠키가 서버로 전송됩니다.
    headers: {
        'Content-Type': 'application/json',
    },
})

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
    const runConfig = useRuntimeConfig()
    const baseURL = runConfig.public.apiBaseUrl || '/api'

    const source = axios.CancelToken.source()

    const promise = AXIOS_INSTANCE({
        ...config,
        baseURL,
        cancelToken: source.token,
        // 💡 이제 headers에서 Authorization 주입 로직을 삭제합니다. (브라우저가 자동 처리)
    }).then(({ data }) => data)

    // @ts-ignore
    promise.cancel = () => {
        source.cancel('Query was cancelled by Orval')
    }

    return promise
}

// 2. 전역 에러 처리 (세션 만료 대응)
AXIOS_INSTANCE.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            const authStore = useAuthStore()
            authStore.clearAuth() // 스토어 초기화

            // 세션이 만료되었으므로 로그인 페이지로 이동
            navigateTo('/login')
        }
        return Promise.reject(error)
    }
)

export default customInstance