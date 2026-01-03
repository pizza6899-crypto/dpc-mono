import axios from 'axios';
import type { AxiosRequestConfig, AxiosInstance } from 'axios';
// @ts-ignore
import { useRuntimeConfig } from '#app';

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
        (config) => {
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
            // 세션 만료(401) 등 공통 에러 처리
            if (error.response?.status === 401) {
                // 로그인 페이지 이동 로직 등
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