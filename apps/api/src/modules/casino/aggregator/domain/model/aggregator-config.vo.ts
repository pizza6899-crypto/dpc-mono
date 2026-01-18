export interface BaseAggregatorConfig {
    apiEndpoint: string;
    webhookIps?: string[];
    timeout?: number;
}

// DC 애그리게이터 설정
export interface DcAggregatorConfig extends BaseAggregatorConfig {
    apiKey: string;
    apiSecret: string;
}

// Whitecliff 애그리게이터 설정
export interface WhitecliffAggregatorConfig extends BaseAggregatorConfig {
    merchantId: string;
    secretKey: string;
    operatorCode: string;
}

// 타입 유니온
export type AggregatorConfig = DcAggregatorConfig | WhitecliffAggregatorConfig | BaseAggregatorConfig;

// 타입 가드
export function isDcConfig(config: AggregatorConfig): config is DcAggregatorConfig {
    return 'apiKey' in config && 'apiSecret' in config;
}

export function isWhitecliffConfig(config: AggregatorConfig): config is WhitecliffAggregatorConfig {
    return 'merchantId' in config && 'secretKey' in config;
}
