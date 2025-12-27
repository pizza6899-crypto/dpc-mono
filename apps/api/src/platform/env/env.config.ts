import { registerAs } from '@nestjs/config';
import { WhitecliffConfig } from './env.types';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  staticAssetsBaseUrl: process.env.STATIC_ASSETS_BASE_URL || '/static', // 추가
  backendUrl: process.env.BACKEND_URL,
  frontendUrl: process.env.FRONTEND_URL,
  cdnUrl: process.env.CDN_URL,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: process.env.JWT_ISSUER || 'https://api.example.com',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
}));

export const googleOAuthConfig = registerAs('googleOAuth', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
}));

export const whitecliffConfig = registerAs('whitecliff', () => {
  const configs: WhitecliffConfig[] = [];
  let index = 1;

  // 인덱스 기반 설정 읽기 (WHITECLIFF_1_*, WHITECLIFF_2_* 등)
  while (process.env[`WHITECLIFF_${index}_AGENT_CODE`]) {
    configs.push({
      apiEnabled: process.env[`WHITECLIFF_${index}_API_ENABLED`] === 'true',
      redirectHomeUrl:
        process.env[`WHITECLIFF_${index}_REDIRECT_HOME_URL`] || '',
      endpoint: process.env[`WHITECLIFF_${index}_ENDPOINT`] || '',
      agentCode: process.env[`WHITECLIFF_${index}_AGENT_CODE`] || '',
      token: process.env[`WHITECLIFF_${index}_TOKEN`] || '',
      secretKey: process.env[`WHITECLIFF_${index}_SECRET_KEY`] || '',
      currency: process.env[`WHITECLIFF_${index}_CURRENCY`] || '',
      walletType: process.env[`WHITECLIFF_${index}_WALLET_TYPE`] || '',
    });
    index++;
  }

  // 설정이 없으면 빈 배열 반환 (에러 처리 필요)
  if (configs.length === 0) {
    throw new Error('At least one Whitecliff configuration is required');
  }

  return configs;
});

export const dcsConfig = registerAs('dcs', () => ({
  apiEnabled: process.env.DCS_API_ENABLED === 'true',
  apiUrl: process.env.DCS_API_URL,
  getBetDataUrl: process.env.DCS_GET_BET_DATA_URL,
  apiKey: process.env.DCS_API_KEY,
  brandId: process.env.DCS_BRAND_ID,
  brandApiUrl: process.env.DCS_BRAND_API_URL,
}));

export const schedulerConfig = registerAs('scheduler', () => ({
  enabled: process.env.SCHEDULER_ENABLED === 'true',
  whitecliffPushedBetHistoryEnabled:
    process.env.WHITECLIFF_PUSHED_BET_HISTORY_SCHEDULER_ENABLED === 'true',
  exchangeRateUpdateEnabled:
    process.env.EXCHANGE_RATE_UPDATE_SCHEDULER_ENABLED === 'true',
  settleDailyCommissionsEnabled:
    process.env.SETTLE_DAILY_COMMISSIONS_SCHEDULER_ENABLED === 'true',
}));

export const nowPaymentConfig = registerAs('nowPayment', () => ({
  enabled: process.env.NOWPAYMENT_ENABLED === 'true',
  email: process.env.NOWPAYMENT_EMAIL,
  password: process.env.NOWPAYMENT_PASSWORD,
  baseUrl: process.env.NOWPAYMENT_BASE_URL || 'https://api.nowpayments.io',
  apiKey: process.env.NOWPAYMENT_API_KEY,
  ipnSecretKey: process.env.NOWPAYMENT_IPN_SECRET_KEY,
  ipnCallbackUrl: process.env.NOWPAYMENT_IPN_CALLBACK_URL,
  isFixedRate: process.env.NOWPAYMENT_IS_FIXED_RATE === 'true',
  isFeePaidByUser: process.env.NOWPAYMENT_IS_FEE_PAID_BY_USER === 'true',
}));

export const sessionConfig = registerAs('session', () => ({
  secret: process.env.SESSION_SECRET,
  maxAge: parseInt(process.env.SESSION_MAX_AGE ?? '604800000', 10), // 7일 (밀리초)
  secure: process.env.SESSION_SECURE === 'true',
  httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
  sameSite:
    (process.env.SESSION_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax',
  name: process.env.SESSION_NAME || 'sessionId',
}));

export const adminSessionConfig = registerAs('adminSession', () => ({
  secret: process.env.ADMIN_SESSION_SECRET,
  maxAge: parseInt(process.env.ADMIN_SESSION_MAX_AGE ?? '3600000', 10), // 1시간 (밀리초)
  secure: process.env.ADMIN_SESSION_SECURE === 'true',
  httpOnly: process.env.ADMIN_SESSION_HTTP_ONLY !== 'false',
  sameSite:
    (process.env.ADMIN_SESSION_SAME_SITE as 'lax' | 'strict' | 'none') ||
    'strict',
  name: process.env.ADMIN_SESSION_NAME || 'adminSessionId',
}));

export const csrfConfig = registerAs('csrf', () => ({
  enabled: process.env.CSRF_ENABLED === 'true',
  cookieName: process.env.CSRF_COOKIE_NAME || 'XSRF-TOKEN',
  headerName: process.env.CSRF_HEADER_NAME || 'X-XSRF-TOKEN',
  secure: process.env.CSRF_SECURE === 'true',
  sameSite:
    (process.env.CSRF_SAME_SITE as 'lax' | 'strict' | 'none') || 'strict',
  maxAge: parseInt(process.env.CSRF_MAX_AGE ?? '86400000', 10), // 24시간 (밀리초)
  httpOnly: process.env.CSRF_HTTP_ONLY !== 'false',
}));

export const smtpConfig = registerAs('smtp', () => ({
  enabled: process.env.SMTP_ENABLED === 'true',
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true면 465, false면 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: process.env.SMTP_FROM || process.env.SMTP_USER,
}));

export const coingeckoConfig = registerAs('coingecko', () => ({
  enabled: process.env.COINGECKO_ENABLED === 'true',
  apiUrl: process.env.COINGECKO_API_URL,
  apiKey: process.env.COINGECKO_API_KEY,
}));

// Open Exchange Rates 설정 추가
export const openExchangeRatesConfig = registerAs('openExchangeRates', () => ({
  enabled: process.env.OPEN_EXCHANGE_RATES_ENABLED === 'true',
  apiUrl: process.env.OPEN_EXCHANGE_RATES_API_URL,
  appKey: process.env.OPEN_EXCHANGE_RATES_APP_KEY, // Open Exchange Rates는 app_id 사용
}));

export const depositConfig = registerAs('deposit', () => ({
  cryptoDepositEnabled: process.env.CRYPTO_DEPOSIT_ENABLED === 'true',
  cryptoDepositAllowedCurrencies: process.env.CRYPTO_DEPOSIT_ALLOWED_CURRENCIES
    ? process.env.CRYPTO_DEPOSIT_ALLOWED_CURRENCIES.split(',').map((c) =>
        c.trim().toUpperCase(),
      )
    : [], // 기본값: 빈 배열 (모든 통화 허용) 또는 기본 암호화폐 목록

  bankTransferEnabled: process.env.BANK_TRANSFER_DEPOSIT_ENABLED === 'true',
  bankTransferAllowedCurrencies: process.env.BANK_TRANSFER_ALLOWED_CURRENCIES
    ? process.env.BANK_TRANSFER_ALLOWED_CURRENCIES.split(',').map((c) =>
        c.trim().toUpperCase(),
      )
    : [],
}));

export const walletConfig = registerAs('wallet', () => ({
  allowedCurrencies: process.env.WALLET_ALLOWED_CURRENCIES
    ? process.env.WALLET_ALLOWED_CURRENCIES.split(',').map((c) =>
        c.trim().toUpperCase(),
      )
    : [], // 기본값
}));

export const prismaConfig = registerAs('prisma', () => ({
  slowQueryThresholdMs: parseInt(
    process.env.PRISMA_SLOW_QUERY_THRESHOLD_MS ?? '1000',
    10,
  ), // 기본값: 1000ms
  queryLoggingEnabled: process.env.PRISMA_QUERY_LOGGING_ENABLED === 'true', // 개발 환경에서 모든 쿼리 로깅 여부
}));
