import type { UserIntelligencePolicy } from '../domain/user-intelligence-policy.entity';

export interface IPolicyRepositoryPort {
  /**
   * 현재 활성화된 정책 조회
   * 없을 경우 null 반환 → DefaultPolicy 사용
   */
  findActivePolicy(): Promise<UserIntelligencePolicy | null>;

  /**
   * 정책 저장 및 활성화 (기존 활성 정책은 자동 비활성화)
   */
  savePolicy(policy: UserIntelligencePolicy): Promise<{ id: number }>;

  /**
   * 특정 정책 비활성화
   */
  deactivatePolicy(id: number): Promise<void>;
}

export const POLICY_REPOSITORY_PORT = Symbol('POLICY_REPOSITORY_PORT');
