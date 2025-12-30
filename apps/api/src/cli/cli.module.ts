import { Module } from '@nestjs/common';
import { BaseCommand } from './commands/base.command';
import { EnvModule } from '../common/env/env.module';
import { RedisModule } from 'src/common/redis/redis.module';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { PaymentModule } from 'src/modules/payment/payment.module';
import { NowPaymentCommand } from './commands/nowpayment.command';
import { BankAccountCommand } from './commands/bank-account.command';
import { CreateAdminCommand } from './commands/create-admin.command';

@Module({
  imports: [EnvModule, RedisModule, PrismaModule, PaymentModule],
  providers: [
    BaseCommand,
    NowPaymentCommand,
    BankAccountCommand,
    CreateAdminCommand,
  ],
  exports: [BaseCommand],
})
export class CliModule {}
