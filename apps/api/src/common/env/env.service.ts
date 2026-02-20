import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EnvironmentConfig,
  AppConfig,
  JwtConfig,
  RedisConfig,
  GoogleOAuthConfig,
  WhitecliffConfig,
  SchedulerConfig,
  NowPaymentConfig,
  SessionConfig,
  AdminSessionConfig,
  CsrfConfig,
  DcsConfig,
  SmtpConfig,
  CoingeckoConfig,
  DepositConfig,
  WalletConfig,
  OpenExchangeRatesConfig,
  SqidsConfig,
  StorageConfig,
} from './env.types';

@Injectable()
export class EnvService {
  constructor(private configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get app(): AppConfig {
    return this.configService.get<AppConfig>('app')!;
  }

  get jwt(): JwtConfig {
    return this.configService.get<JwtConfig>('jwt')!;
  }

  get redis(): RedisConfig {
    return this.configService.get<RedisConfig>('redis')!;
  }

  get googleOAuth(): GoogleOAuthConfig {
    return this.configService.get<GoogleOAuthConfig>('googleOAuth')!;
  }

  get whitecliff(): WhitecliffConfig[] {
    return this.configService.get<WhitecliffConfig[]>('whitecliff')!;
  }

  get dcs(): DcsConfig {
    return this.configService.get<DcsConfig>('dcs')!;
  }

  get scheduler(): SchedulerConfig {
    return this.configService.get<SchedulerConfig>('scheduler')!;
  }

  get nowPayment(): NowPaymentConfig {
    return this.configService.get<NowPaymentConfig>('nowPayment')!;
  }

  /**
   * PM2 인스턴스 넘버를 반환합니다.
   * 환경 변수 NODE_APP_INSTANCE가 없으면 '0'을 반환합니다.
   */
  get pm2InstanceNumber(): string {
    return this.configService.get<string>('NODE_APP_INSTANCE', '0');
  }

  get session(): SessionConfig {
    return this.configService.get<SessionConfig>('session')!;
  }

  get adminSession(): AdminSessionConfig {
    return this.configService.get<AdminSessionConfig>('adminSession')!;
  }

  get csrf(): CsrfConfig {
    return this.configService.get<CsrfConfig>('csrf')!;
  }

  get smtp(): SmtpConfig {
    return this.configService.get<SmtpConfig>('smtp')!;
  }

  get coingecko(): CoingeckoConfig {
    return this.configService.get<CoingeckoConfig>('coingecko')!;
  }

  get openExchangeRates(): OpenExchangeRatesConfig {
    return this.configService.get<OpenExchangeRatesConfig>(
      'openExchangeRates',
    )!;
  }

  get deposit(): DepositConfig {
    return this.configService.get<DepositConfig>('deposit')!;
  }

  get wallet(): WalletConfig {
    return this.configService.get<WalletConfig>('wallet')!;
  }

  get sqids(): SqidsConfig {
    return this.configService.get<SqidsConfig>('sqids')!;
  }

  get storage(): StorageConfig {
    return this.configService.get<StorageConfig>('storage')!;
  }

  get all(): EnvironmentConfig {
    return {
      app: this.app,
      jwt: this.jwt,
      redis: this.redis,
      googleOAuth: this.googleOAuth,
      whitecliff: this.whitecliff,
      dcs: this.dcs,
      scheduler: this.scheduler,
      nowPayment: this.nowPayment,
      session: this.session,
      adminSession: this.adminSession,
      csrf: this.csrf,
      smtp: this.smtp, // 추가
      coingecko: this.coingecko,
      openExchangeRates: this.openExchangeRates,
      deposit: this.deposit,
      wallet: this.wallet,
      sqids: this.sqids,
      storage: this.storage,
    };
  }
}
