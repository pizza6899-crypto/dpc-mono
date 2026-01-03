import axios, { type AxiosRequestConfig, type AxiosError } from 'axios'

// 전역 설정
export const AXIOS_INSTANCE = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // nuxt.config.ts의 proxy 설정과 맞춤
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// 💡 Request Interceptor: 요청 보낼 때 헤더에 토큰 자동 주입
AXIOS_INSTANCE.interceptors.request.use(
    (config) => {
        // CSR 환경이므로 localStorage나 cookie에서 토큰 추출
        // Pinia store를 여기서 직접 부르면 초기화 에러가 날 수 있으므로 필요 시 사용
        const token = localStorage.getItem('auth_token')

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// 💡 Response Interceptor: 에러 공통 처리 (401 권한 없음 등)
AXIOS_INSTANCE.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // 로그아웃 처리 및 로그인 페이지 이동 로직
            console.error('인증이 만료되었습니다.')
            localStorage.removeItem('auth_token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// Orval mutator 전용 함수
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
    const source = axios.CancelToken.source()
    const promise = AXIOS_INSTANCE({
        ...config,
        cancelToken: source.token,
    }).then(({ data }) => data)

    // @ts-ignore
    promise.cancel = () => {
        source.cancel('Query was cancelled by Orval')
    }

    return promise
}

export default customInstance