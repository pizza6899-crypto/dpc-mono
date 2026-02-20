import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { AffiliateCodePolicy, AffiliateCodeNotFoundException } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

@Injectable()
export class DeleteCodeAdminService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    private readonly policy: AffiliateCodePolicy,
    private readonly advisoryLockService: AdvisoryLockService,
  ) {}

  @Transactional()
  async execute(id: string): Promise<void> {
    const bigIntId = BigInt(id);
    const code = await this.repository.findByIdAdmin(bigIntId);

    if (!code) {
      throw new AffiliateCodeNotFoundException(id);
    }

    // 사용자 락 획득 (동시성 제어)
    await this.advisoryLockService.acquireLock(
      LockNamespace.AFFILIATE_CODE,
      code.userId.toString(),
      {
        throwThrottleError: true,
      },
    );

    // 삭제 정책 검증을 위해 전체 코드 개수 조회
    const totalCodes = await this.repository.countByUserId(code.userId);

    // 삭제 가능 여부 확인
    this.policy.canDeleteCode(code, totalCodes);

    await this.repository.deleteById(bigIntId);
  }
}
