import { Module } from '@nestjs/common';
import { RollingService } from './application/rolling.service';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { ConcurrencyModule } from 'src/platform/concurrency/concurrency.module';
import { RollingCheckService } from './application/rolling-check.service';
import { RollingController } from './controllers/rolling.controller';

@Module({
  imports: [PrismaModule, ConcurrencyModule],
  providers: [RollingService, RollingCheckService],
  controllers: [RollingController],
  exports: [RollingService, RollingCheckService],
})
export class RollingModule {}
