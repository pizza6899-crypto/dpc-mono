import { Inject, Injectable } from '@nestjs/common';
import { type PolicyConfiguration } from '../domain/policy-config.types';
import { UserIntelligencePolicy } from '../domain/user-intelligence-policy.entity';
import { POLICY_REPOSITORY_PORT } from '../ports/policy-repository.port';
import type { IPolicyRepositoryPort } from '../ports/policy-repository.port';

/**
 * [Policy] 새로운 정책을 생성하고 활성화하는 서비스 (Command)
 * - 신규 정책 생성 시 이전 정책들은 자동으로 비활성화됩니다.
 */
@Injectable()
export class ApplyNewPolicyService {
  constructor(
    @Inject(POLICY_REPOSITORY_PORT)
    private readonly policyRepo: IPolicyRepositoryPort,
  ) { }

  /**
   * 새 정책 저장 및 적용
   */
  async execute(config: PolicyConfiguration, adminNote?: string): Promise<{ id: number }> {
    const policy = UserIntelligencePolicy.create({ config, adminNote });
    return this.policyRepo.savePolicy(policy);
  }

  /**
   * 특정 정책 수동 비활성화
   */
  async deactivate(id: number): Promise<void> {
    return this.policyRepo.deactivatePolicy(id);
  }
}
