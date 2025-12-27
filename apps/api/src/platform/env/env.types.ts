import type { ExchangeCurrencyCode } from '@prisma/client';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  corsOrigin: string[];
  staticAssetsBaseUrl?: string; // 추가: 기본값은 '/static', CDN 사용 시 전체 URL

  backendUrl: string; // 백엔드 API 주소
  frontendUrl: string; // 프론트엔드 주소
  cdnUrl: string; // CDN 주소
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface WhitecliffConfig {
  apiEnabled: boolean;
  redirectHomeUrl: string;
  endpoint: string;
  agentCode: string;
  token: string;
  secretKey: string;
  currency: string;
  walletType: string;
}

export interface DcsConfig {
  apiEnabled: boolean;
  apiUrl: string;
  getBetDataUrl: string;
  apiKey: string;
  brandId: string;
  brandApiUrl: string;
}

export interface SchedulerConfig {
  enabled: boolean;
  whitecliffPushedBetHistoryEnabled: boolean;
  exchangeRateUpdateEnabled: boolean;
  settleDailyCommissionsEnabled: boolean;
}

export interface NowPaymentConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  email: string;
  password: string;
  ipnSecretKey: string;
  ipnCallbackUrl: string;
  isFixedRate: boolean;
  isFeePaidByUser: boolean;
}

export interface SessionConfig {
  secret: string;
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  name: string;
}

export interface AdminSessionConfig {
  secret: string;
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  name: string;
}

export interface CsrfConfig {
  enabled: boolean;
  cookieName: string;
  headerName: string;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge: number;
  httpOnly: boolean;
}

export interface SmtpConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface CoingeckoConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey?: string;
}

export interface OpenExchangeRatesConfig {
  enabled: boolean;
  apiUrl: string;
  appKey: string;
}

export interface DepositConfig {
  cryptoDepositEnabled: boolean; // 암호화폐 입금 활성화
  cryptoDepositAllowedCurrencies: ExchangeCurrencyCode[]; // 추가

  bankTransferEnabled: boolean; // 뱅크 트랜스퍼 활성화
  bankTransferAllowedCurrencies: ExchangeCurrencyCode[]; // 뱅크 트랜스퍼 허용 통화 목록
}

export interface WalletConfig {
  allowedCurrencies: ExchangeCurrencyCode[];
}

// Prisma 설정 인터페이스 추가
export interface PrismaConfig {
  slowQueryThresholdMs: number; // 슬로우 쿼리 임계값 (ms)
  queryLoggingEnabled: boolean; // 쿼리 로깅 여부
}

export interface EnvironmentConfig {
  app: AppConfig;
  jwt: JwtConfig;
  redis: RedisConfig;
  googleOAuth: GoogleOAuthConfig;
  whitecliff: WhitecliffConfig[];
  dcs: DcsConfig;
  scheduler: SchedulerConfig;
  nowPayment: NowPaymentConfig;
  session: SessionConfig;
  adminSession: AdminSessionConfig;
  csrf: CsrfConfig;
  smtp: SmtpConfig;
  coingecko: CoingeckoConfig;
  openExchangeRates: OpenExchangeRatesConfig;
  deposit: DepositConfig;
  wallet: WalletConfig;
  prisma: PrismaConfig;
}
