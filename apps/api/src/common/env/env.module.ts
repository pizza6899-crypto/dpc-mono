import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvService } from './env.service';
import {
  appConfig,
  jwtConfig,
  redisConfig,
  googleOAuthConfig,
  whitecliffConfig,
  schedulerConfig,
  nowPaymentConfig,
  sessionConfig,
  adminSessionConfig,
  csrfConfig,
  dcsConfig,
  smtpConfig,
  coingeckoConfig,
  depositConfig,
  walletConfig,
  openExchangeRatesConfig,
  sqidsConfig,
  storageConfig,
  cloudflareAiConfig,
} from './env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        jwtConfig,
        redisConfig,
        googleOAuthConfig,
        whitecliffConfig,
        dcsConfig,
        schedulerConfig,
        nowPaymentConfig,
        sessionConfig,
        adminSessionConfig,
        csrfConfig,
        smtpConfig,
        coingeckoConfig,
        openExchangeRatesConfig,
        depositConfig,
        walletConfig,
        sqidsConfig,
        storageConfig,
        cloudflareAiConfig,
      ],
    }),
  ],
  providers: [EnvService],
  exports: [EnvService, ConfigModule],
})
export class EnvModule {}
