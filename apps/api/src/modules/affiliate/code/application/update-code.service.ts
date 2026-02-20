import { Inject, Injectable } from '@nestjs/common';
import {
  AffiliateCode,
  AffiliateCodeNotFoundException,
  AffiliateCodePolicy,
} from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

import { Transactional } from '@nestjs-cls/transactional';

interface UpdateCodeParams {
  id: bigint;
  userId: bigint;
  campaignName?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

@Injectable()
export class UpdateCodeService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    private readonly policy: AffiliateCodePolicy,
    private readonly advisoryLockService: AdvisoryLockService,
  ) {}

  @Transactional()
  async execute({
    id,
    userId,
    campaignName,
    isActive,
    isDefault,
  }: UpdateCodeParams): Promise<AffiliateCode> {
    // 사용자 기반 락 획득 (동시 요청 처리 방지)
    // 트랜잭션 내에서 실행되므로 트랜잭션 종료 시 자동으로 해제됩니다.
    await this.advisoryLockService.acquireLock(
      LockNamespace.AFFILIATE_CODE,
      userId.toString(),
      {
        throwThrottleError: true,
      },
    );

    const code = await this.repository.findById(id);
    if (!code || code.userId !== userId) {
      throw new AffiliateCodeNotFoundException(id);
    }

    // 도메인 엔티티 업데이트
    code.updateCampaignName(campaignName);

    if (isActive !== undefined) {
      // 정책 체크: 기본 코드는 비활성화할 수 없음
      if (isActive === false) {
        this.policy.canDeactivate(code);
      }
      code.setActive(isActive);
    }

    // 기본 코드 설정 로직
    if (isDefault === true) {
      const existingDefault = await this.repository.findDefaultByUserId(userId);

      const updates: Array<{ code: AffiliateCode }> = [];
      code.setAsDefault();
      updates.push({ code });

      // 기본 코드는 항상 활성화되어야 하므로 활성화 처리
      code.setActive(true);

      if (existingDefault && existingDefault.id !== code.id) {
        existingDefault.unsetAsDefault();
        updates.push({ code: existingDefault });
      }

      const updatedCodes = await this.repository.updateMany(updates);
      return updatedCodes.find((c) => c.id === code.id) || code;
    }

    // 기본 코드 해제 (강제로 false가 넘어온 경우)
    if (isDefault === false) {
      // 정책 체크: 기본 코드는 직접 해제할 수 없음 (다른 코드를 기본으로 설정해야 함)
      this.policy.canUnsetDefault(code);
      code.unsetAsDefault();
    }

    // 일반 저장
    return await this.repository.update(code);
  }
}
