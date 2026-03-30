import { Module } from '@nestjs/common';
import { BaseCommand } from './commands/base.command';
import { EnvModule } from '../infrastructure/env/env.module';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { PaymentModule } from 'src/modules/payment/payment.module';
import { NowPaymentCommand } from './commands/nowpayment.command';
import { CreateAdminCommand } from './commands/create-admin.command';

@Module({
  imports: [EnvModule, RedisModule, PrismaModule, PaymentModule],
  providers: [BaseCommand, NowPaymentCommand, CreateAdminCommand],
  exports: [BaseCommand],
})
export class CliModule {}
