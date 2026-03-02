import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { COMP_REPOSITORY } from '../ports';
import type { CompRepositoryPort } from '../ports';
import { FindCompAccountService } from './find-comp-account.service';
import { CompAccount } from '../domain';

@Injectable()
export class UpdateCompAccountStatusService {
  constructor(
    @Inject(COMP_REPOSITORY)
    private readonly compRepository: CompRepositoryPort,
    private readonly findCompAccountService: FindCompAccountService,
    private readonly advisoryLockService: AdvisoryLockService,
  ) {}

  @Transactional()
  async execute(params: {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    isFrozen: boolean;
  }): Promise<CompAccount> {
    await this.advisoryLockService.acquireLock(
      LockNamespace.COMP_ACCOUNT,
      params.userId.toString(),
      {
        throwThrottleError: true,
      },
    );

    const account = await this.findCompAccountService.execute(
      params.userId,
      params.currency,
    );

    const updatedAccount = account.updateStatus(params.isFrozen);
    return await this.compRepository.save(updatedAccount);
  }
}
