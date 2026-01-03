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

interface ApiErrorData {
    success: boolean
    messageCode: string
    message: string
    timestamp: string
    statusCode: number
}

// 2. 전역 에러 처리 (세션 만료 대응 및 다국어 처리)
AXIOS_INSTANCE.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorData>) => {
        const data = error.response?.data

        // messageCode가 있으면 다국어 처리 시도
        if (data?.messageCode) {
            try {
                const { $i18n } = useNuxtApp()
                // @ts-ignore
                const translatedMessage = $i18n.t(`api_errors.${data.messageCode}`)

                // 번역 키가 존재할 경우에만 메시지 교체 (없으면 서버 메시지 유지)
                if (translatedMessage && translatedMessage !== `api_errors.${data.messageCode}`) {
                    data.message = translatedMessage
                }
            } catch (e) {
                console.error('Failed to translate error message', e)
            }
        }

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