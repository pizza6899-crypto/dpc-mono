import axios from 'axios';
import type { AxiosRequestConfig, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
// @ts-ignore
import { useRuntimeConfig, useNuxtApp } from '#app';
import { useAuthStore } from '@stores/auth';

// 인스턴스를 함수 밖에서 선언하여 재사용합니다.
let axiosInstance: AxiosInstance | null = null;

const getSharedInstance = () => {
    if (axiosInstance) return axiosInstance;

    const configRuntime = useRuntimeConfig();

    axiosInstance = axios.create({
        baseURL: configRuntime.public.apiBase,
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // 인터셉터는 여기서 딱 한 번만 설정
    axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        },
        (error) => Promise.reject(error)
    );

    axiosInstance.interceptors.response.use(
        (response) => {
            console.log(`[API Response] ${response.status} ${response.config.url}`);
            return response;
        },
        (error) => {
            console.error(`[API Error] ${error.response?.status} ${error.config?.url}`, error.response?.data);

            // 에러 발생 시 토스트 알림 추가
            try {
                const toast = useToast();
                // 백엔드에서 내려오는 에러 메시지 구조에 맞춰 조정 (보통 error.response.data.message)
                const errorMessage = error.response?.data?.message || error.message || '알 수 없는 에러가 발생했습니다.';

                // 401(세션만료)은 로그아웃 처리가 우선이므로 토스트 생략 가능 (필요시 추가)
                if (error.response?.status !== 401) {
                    toast.add({
                        title: 'API Error',
                        description: errorMessage,
                        color: 'red',
                        icon: 'i-heroicons-exclamation-circle'
                    });
                }
            } catch (e) {
                console.warn('Toast failed', e);
            }

            // 세션 만료(401) 등 공통 에러 처리
            if (error.response?.status === 401) {
                try {
                    const nuxtApp = useNuxtApp();
                    const authStore = useAuthStore(nuxtApp.$pinia);
                    authStore.logout();
                } catch (e) {
                    // Error handling for logout failure
                }
            }
            return Promise.reject(error);
        }
    );

    return axiosInstance;
};

export const customInstance = <T>(
    config: AxiosRequestConfig,
    options?: AxiosRequestConfig,
): Promise<T> => {
    const source = axios.CancelToken.source();
    const instance = getSharedInstance(); // 공유된 인스턴스 가져오기

    const promise = instance({
        ...config,
        ...options,
        cancelToken: source.token,
    }).then(({ data }) => data);

    // @ts-ignore
    promise.cancel = () => {
        source.cancel('Query was cancelled');
    };

    return promise;
};

export default customInstance;