import { Global, Module } from '@nestjs/common';
import { ConcurrencyService } from './concurrency.service';
import { AdvisoryLockService } from './advisory-lock.service';

@Global()
@Module({
  providers: [ConcurrencyService, AdvisoryLockService],
  exports: [ConcurrencyService, AdvisoryLockService],
})
export class ConcurrencyModule {}
