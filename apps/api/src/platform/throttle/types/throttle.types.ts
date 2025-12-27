import { Request } from 'express';

export interface ThrottleOptions {
  limit: number; // 허용할 최대 요청 수
  ttl: number; // 시간 윈도우 (초 단위)
  scope?: ThrottleScope;
  keyGenerator?: (request: Request) => string; // 커스텀 키 생성 함수
}

export enum ThrottleScope {
  IP = 'ip', // IP 기반
  USER = 'user', // 사용자 ID 기반
  GLOBAL = 'global', // 전역
  CUSTOM = 'custom', // 커스텀 키 생성 함수 사용
}

export interface ThrottleResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp (초)
  retryAfter?: number; // 초 단위
}
