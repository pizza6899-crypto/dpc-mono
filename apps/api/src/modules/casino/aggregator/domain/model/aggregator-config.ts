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
    currency: string;
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
    meta: { id: bigint; code: string; name: string; status: string; apiEnabled: boolean },
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

export function createWhitecliffAggregatorConfig(
    meta: { id: bigint; code: string; name: string; status: string; apiEnabled: boolean },
    env: WhitecliffConfig,
): WhitecliffAggregatorConfig {
    return {
        // DB 메타
        id: meta.id,
        code: meta.code,
        name: meta.name,
        status: meta.status,
        apiEnabled: meta.apiEnabled,
        // Env 설정
        currency: env.currency,
        endpoint: env.endpoint,
        agentCode: env.agentCode,
        token: env.token,
        secretKey: env.secretKey,
        walletType: env.walletType,
        redirectHomeUrl: env.redirectHomeUrl,
    };
}
