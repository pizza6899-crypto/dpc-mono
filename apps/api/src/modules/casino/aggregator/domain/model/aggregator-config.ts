import type { DcsConfig, WhitecliffConfig } from 'src/common/env/env.types';

/**
 * DCS 애그리게이터 통합 설정
 * DB 메타 정보 + Env API 설정을 결합
 */
export interface DcsAggregatorConfig {
  // DB 메타 정보
  id: bigint;
  code: string;
  name: string;
  status: string;
  apiEnabled: boolean;

  // Env API 설정
  apiUrl: string;
  getBetDataUrl: string;
  apiKey: string;
  brandId: string;
  brandApiUrl: string;
}

/**
 * Whitecliff 애그리게이터 통합 설정 (특정 통화용)
 * DB 메타 정보 + Env API 설정을 결합
 */
export interface WhitecliffAggregatorConfig {
  // DB 메타 정보
  id: bigint;
  code: string;
  name: string;
  status: string;
  apiEnabled: boolean;

  // Env API 설정 (통화별)
  internalCurrency: string; // 내부 시스템 용
  externalCurrency: string; // 외부 서비스 용 (3rd party)
  endpoint: string;
  agentCode: string;
  token: string;
  secretKey: string;
  walletType: string;
  redirectHomeUrl: string;
}

/**
 * DB 메타 정보와 Env 설정을 병합하여 통합 설정 객체를 생성합니다.
 */
export function createDcsAggregatorConfig(
  meta: {
    id: bigint;
    code: string;
    name: string;
    status: string;
    apiEnabled: boolean;
  },
  env: DcsConfig,
): DcsAggregatorConfig {
  return {
    // DB 메타
    id: meta.id,
    code: meta.code,
    name: meta.name,
    status: meta.status,
    apiEnabled: meta.apiEnabled,
    // Env 설정
    apiUrl: env.apiUrl,
    getBetDataUrl: env.getBetDataUrl,
    apiKey: env.apiKey,
    brandId: env.brandId,
    brandApiUrl: env.brandApiUrl,
  };
}

import { WHITECLIFF_CURRENCY_MAPPING } from '../const/currency-mapping.const';

export function createWhitecliffAggregatorConfig(
  meta: {
    id: bigint;
    code: string;
    name: string;
    status: string;
    apiEnabled: boolean;
  },
  env: WhitecliffConfig,
): WhitecliffAggregatorConfig {
  // 1. 매핑 테이블에서 내부 통화 코드 조회
  // 2. 없으면 외부 통화 코드를 그대로 사용 (예: KRW -> KRW)
  const internalCurrency =
    WHITECLIFF_CURRENCY_MAPPING[env.currency] || env.currency;

  if (!internalCurrency) {
    throw new Error(
      'Internal currency must be defined for Whitecliff configuration',
    );
  }

  return {
    // DB 메타
    id: meta.id,
    code: meta.code,
    name: meta.name,
    status: meta.status,
    apiEnabled: meta.apiEnabled,
    // Env 설정
    internalCurrency: internalCurrency,
    externalCurrency: env.currency,
    endpoint: env.endpoint,
    agentCode: env.agentCode,
    token: env.token,
    secretKey: env.secretKey,
    walletType: env.walletType,
    redirectHomeUrl: env.redirectHomeUrl,
  };
}
