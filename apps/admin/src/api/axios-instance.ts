import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // 핵심: 쿠키를 요청에 포함하고 응답의 쿠키를 저장함
  headers: {
    'Content-Type': 'application/json',
  },
});

export type ErrorType<Error> = AxiosError<Error>;