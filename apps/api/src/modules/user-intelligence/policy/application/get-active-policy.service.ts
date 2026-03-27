import { Inject, Injectable } from '@nestjs/common';
import { type PolicyConfiguration } from '../domain/policy-config.types';
import { UserIntelligencePolicy } from '../domain/user-intelligence-policy.entity';
import { PolicyNotFoundException } from '../domain/policy.errors';
import { POLICY_REPOSITORY_PORT } from '../ports/policy-repository.port';
import type { IPolicyRepositoryPort } from '../ports/policy-repository.port';

/**
 * [Policy] 현재 활성 정책을 조회하는 서비스 (Query)
 */
@Injectable()
export class GetActivePolicyService {
  constructor(
    @Inject(POLICY_REPOSITORY_PORT)
    private readonly policyRepo: IPolicyRepositoryPort,
  ) { }

  /**
   * DB에 설정된 활성 정책 엔티티 반환
   * @throws PolicyNotFoundException 활성 정책이 없을 경우
   */
  async execute(): Promise<UserIntelligencePolicy> {
    const active = await this.policyRepo.findActivePolicy();
    if (!active) {
      throw new PolicyNotFoundException();
    }
    return active;
  }

  /**
   * 가중치 설정 값만 추출하여 반환
   */
  async getConfig(): Promise<PolicyConfiguration> {
    const policy = await this.execute();
    return policy.config;
  }
}
