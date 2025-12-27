import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { AppLoggerModule } from './platform/logging/app-logger.module';
import { EnvModule } from './platform/env/env.module';
import { APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core';
import { PrismaModule } from './platform/prisma/prisma.module';
import { CasinoModule } from './modules/casino/casino.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentModule } from './modules/payment/payment.module';
import { ExchangeModule } from './modules/exchange/exchange.module';
import { SessionAuthGuard } from './platform/auth/guards/session-auth.guard';
import { VipModule } from './modules/vip/vip.module';
import { CompModule } from './modules/comp/comp.module';
import { RollingModule } from './modules/rolling/rolling.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { ThrottleModule } from './platform/throttle/throttle.module';
import { ThrottleGuard } from './platform/throttle/throttle.guard';
import { WebsocketModule } from './platform/websocket/websocket.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { ActivityLogModule } from './platform/activity-log/activity-log.module';
import { HttpExceptionFilter } from './platform/http/exception/http-exception.filter';

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    ThrottleModule,
    WebsocketModule,
    ScheduleModule.forRoot(),
    AppLoggerModule,
    ActivityLogModule,
    AuthModule,
    CasinoModule,
    PaymentModule,
    ExchangeModule,
    VipModule,
    CompModule,
    RollingModule,
    PromotionModule,
    AffiliateModule,
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
  ],
})
export class AppModule {}
