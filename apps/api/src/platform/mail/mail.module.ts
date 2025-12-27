import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { EnvModule } from '../env/env.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [EnvModule, PrismaModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
