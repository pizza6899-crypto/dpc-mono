import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { BullModule } from '@nestjs/bullmq';
import { EnvModule } from './common/env/env.module';
import { EnvService } from './common/env/env.service';
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  Reflector,
} from '@nestjs/core';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { CasinoModule } from './modules/casino/casino.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentModule } from './modules/payment/payment.module';
import { DepositModule } from './modules/deposit/deposit.module';
import { ExchangeModule } from './modules/exchange/exchange.module';
import { SessionAuthGuard } from './common/auth/guards/session-auth.guard';
import { ThrottleModule } from './common/throttle/throttle.module';
import { ThrottleGuard } from './common/throttle/throttle.guard';
import { WebsocketModule } from './common/websocket/websocket.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { HttpExceptionFilter } from './common/http/exception/http-exception.filter';
import { WalletModule } from './modules/wallet/wallet.module';
import { CommonLoggerModule } from './common/logger/logger.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuditLogInterceptor } from './modules/audit-log/infrastructure/audit-log.interceptor';
import { RequestInfoInterceptor } from './common/http/interceptors/request-info.interceptor';
import { PromotionModule } from './modules/promotion/promotion.module';
import { WageringModule } from './modules/wagering/wagering.module';
import { CompModule } from './modules/comp/comp.module';
import { NodeIdentityModule } from './common/node-identity/node-identity.module';
import { SnowflakeModule } from './common/snowflake/snowflake.module';
import { WithdrawalModule } from './modules/withdrawal/withdrawal.module';
import { SqidsModule } from './common/sqids/sqids.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SocketModule } from './modules/socket/socket.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { FileModule } from './modules/file/file.module';
import { TierModule } from './modules/tier/tier.module';
import { CacheModule } from './common/cache/cache.module';
import { BullMqModule } from './infrastructure/bullmq/bullmq.module';
import { RewardModule } from './modules/reward/reward.module';
import { UserModule } from './modules/user/user.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { AccessControlModule } from './modules/access-control/access-control.module';

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    CacheModule,
    ThrottleModule,
    CommonLoggerModule,
    WebsocketModule,
    NodeIdentityModule,
    SnowflakeModule,
    SqidsModule,
    BullMqModule,
    ScheduleModule.forRoot(),
    AuditLogModule,
    AuthModule,
    UserModule,
    ModerationModule,
    CasinoModule,
    PaymentModule,
    DepositModule,
    WithdrawalModule,
    ExchangeModule,
    AffiliateModule,
    WalletModule,
    PromotionModule,
    WageringModule,
    CompModule,
    NotificationModule,
    SocketModule,
    StorageModule,
    FileModule,
    TierModule,
    RewardModule,
    AccessControlModule,
  ],
  providers: [
    Reflector,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottleGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestInfoInterceptor, // 먼저 실행되어 request.clientInfo 설정
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor, // RequestInfoInterceptor 이후 실행
    },
  ],
})
export class AppModule {}
