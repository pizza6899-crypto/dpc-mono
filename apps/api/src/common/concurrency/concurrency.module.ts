import { Module } from '@nestjs/common';
import { ConcurrencyService } from './concurrency.service';
import { AdvisoryLockService } from './advisory-lock.service';

@Module({
  providers: [ConcurrencyService, AdvisoryLockService],
  exports: [ConcurrencyService, AdvisoryLockService],
})
export class ConcurrencyModule { }
