import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { ConcurrencyModule } from 'src/platform/concurrency/concurrency.module';
import { CompService } from './application/comp.service';
import { CompController } from './controllers/comp.controller';

@Module({
  imports: [PrismaModule, ConcurrencyModule],
  providers: [CompService],
  controllers: [CompController],
  exports: [CompService],
})
export class CompModule {}
