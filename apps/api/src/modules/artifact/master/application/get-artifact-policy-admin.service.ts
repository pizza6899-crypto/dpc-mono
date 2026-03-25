import { Injectable } from '@nestjs/common';
import { ArtifactPolicyRepositoryPort } from '../ports/artifact-policy.repository.port';
import { ArtifactPolicy } from '../domain/artifact-policy.entity';
import { ArtifactPolicyNotFoundException } from '../domain/master.exception';

/**
 * [Artifact] 유물 정책 (뽑기 비용, 합성 설정, 슬롯 해금 등) 전체 조회 서비스 (어드민용)
 */
@Injectable()
export class GetArtifactPolicyAdminService {
  constructor(
    private readonly policyRepo: ArtifactPolicyRepositoryPort,
  ) { }

  /**
   * 유물 작업에 필요한 대형 정책 정보(싱글톤)를 조회하여 반환
   */
  async execute(): Promise<ArtifactPolicy> {
    const policy = await this.policyRepo.findPolicy();
    if (!policy) {
      throw new ArtifactPolicyNotFoundException();
    }
    return policy;
  }
}
