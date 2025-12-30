import { plainToClass, Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  validateSync,
  IsArray,
  IsBoolean,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
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

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @Type(() => Number)
  @IsNumber()
  PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  BACKEND_URL: string;

  @IsString()
  FRONTEND_URL: string;

  @IsString()
  CDN_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  JWT_ISSUER: string;

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string;

  @IsString()
  API_PREFIX: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  CORS_ORIGIN: string[];

  @IsString()
  REDIS_HOST: string;

  @Type(() => Number)
  @IsNumber()
  REDIS_PORT: number;

  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  GOOGLE_CLIENT_SECRET: string;

  @IsString()
  GOOGLE_REDIRECT_URI: string;

  // @Transform(({ value }) => value === 'true')
  // @IsBoolean()
  // WHITECLIFF_API_ENABLED: boolean;

  // @IsString()
  // WHITECLIFF_REDIRECT_HOME_URL: string;

  // @IsString()
  // WHITECLIFF_ENDPOINT: string;

  // @IsString()
  // WHITECLIFF_AGENT_CODE: string;

  // @IsString()
  // WHITECLIFF_TOKEN: string;

  // @IsString()
  // WHITECLIFF_SECRET_KEY: string;

  // @IsString()
  // WHITECLIFF_CURRENCY: string;

  // @IsString()
  // WHITECLIFF_WALLET_TYPE: string;

  // DCS 환경변수 추가
  @IsBoolean()
  DCS_API_ENABLED: boolean;

  @IsString()
  DCS_API_URL: string;

  @IsString()
  DCS_GET_BET_DATA_URL: string;

  @IsString()
  DCS_API_KEY: string;

  @IsString()
  DCS_BRAND_ID: string;

  @IsString()
  DCS_BRAND_API_URL: string;

  // 스케줄러 환경변수 추가
  @IsBoolean()
  SCHEDULER_ENABLED: boolean;

  @IsBoolean()
  WHITECLIFF_PUSHED_BET_HISTORY_SCHEDULER_ENABLED: boolean;

  @IsBoolean()
  EXCHANGE_RATE_UPDATE_SCHEDULER_ENABLED: boolean;

  // 결제 환경변수 추가
  @IsString()
  NOWPAYMENT_EMAIL: string;

  @IsString()
  NOWPAYMENT_PASSWORD: string;

  @IsString()
  NOWPAYMENT_API_KEY: string;

  @IsString()
  NOWPAYMENT_BASE_URL: string;

  @IsBoolean()
  NOWPAYMENT_ENABLED: boolean;

  @IsString()
  NOWPAYMENT_IPN_SECRET_KEY: string;

  @IsString()
  NOWPAYMENT_IPN_CALLBACK_URL: string;

  @IsBoolean()
  NOWPAYMENT_IS_FIXED_RATE: boolean;

  @IsBoolean()
  NOWPAYMENT_IS_FEE_PAID_BY_USER: boolean;

  @IsString()
  SESSION_SECRET: string;

  @IsNumber()
  SESSION_MAX_AGE: number;

  @IsBoolean()
  SESSION_SECURE: boolean;

  @IsBoolean()
  SESSION_HTTP_ONLY: boolean;

  @IsString()
  SESSION_SAME_SITE: string;

  @IsString()
  SESSION_NAME: string;

  @IsString()
  ADMIN_SESSION_SECRET: string;

  @Type(() => Number)
  @IsNumber()
  ADMIN_SESSION_MAX_AGE: number;

  @IsBoolean()
  ADMIN_SESSION_SECURE: boolean;

  @IsBoolean()
  ADMIN_SESSION_HTTP_ONLY: boolean;

  @IsString()
  ADMIN_SESSION_SAME_SITE: string;

  @IsString()
  ADMIN_SESSION_NAME: string;

  @IsBoolean()
  CSRF_ENABLED: boolean;

  @IsString()
  CSRF_COOKIE_NAME: string;

  @IsString()
  CSRF_HEADER_NAME: string;

  @IsBoolean()
  CSRF_SECURE: boolean;

  @IsString()
  CSRF_SAME_SITE: string;

  @Type(() => Number)
  @IsNumber()
  CSRF_MAX_AGE: number;

  @IsBoolean()
  CSRF_HTTP_ONLY: boolean;

  // SMTP 환경변수 추가
  @IsBoolean()
  SMTP_ENABLED: boolean;

  @IsString()
  SMTP_HOST: string;

  @Type(() => Number)
  @IsNumber()
  SMTP_PORT: number;

  @IsBoolean()
  SMTP_SECURE: boolean;

  @IsString()
  SMTP_USER: string;

  @IsString()
  SMTP_PASS: string;

  @IsString()
  SMTP_FROM: string;

  // CoinGecko 환경변수 추가
  @IsBoolean()
  COINGECKO_ENABLED: boolean;

  @IsString()
  COINGECKO_API_URL: string;

  @IsString()
  COINGECKO_API_KEY?: string;

  // Open Exchange Rates 환경변수 추가
  @IsBoolean()
  OPEN_EXCHANGE_RATES_ENABLED: boolean;

  @IsString()
  OPEN_EXCHANGE_RATES_API_URL: string;

  @IsString()
  OPEN_EXCHANGE_RATES_APP_KEY: string;

  // Deposit 관련 환경변수 추가
  @IsBoolean()
  CRYPTO_DEPOSIT_ENABLED: boolean;

  @IsString()
  CRYPTO_DEPOSIT_ALLOWED_CURRENCIES?: string;

  @IsBoolean()
  BANK_TRANSFER_DEPOSIT_ENABLED: boolean;

  @IsString()
  BANK_TRANSFER_ALLOWED_CURRENCIES?: string;

  // Wallet 관련 환경변수 추가
  @IsString()
  WALLET_ALLOWED_CURRENCIES?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
