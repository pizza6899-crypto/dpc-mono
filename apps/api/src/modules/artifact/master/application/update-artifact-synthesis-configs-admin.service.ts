import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ArtifactPolicyRepositoryPort } from '../ports/artifact-policy.repository.port';
import { UpdateArtifactSynthesisConfigsAdminRequestDto } from '../controllers/admin/dto/request/update-artifact-synthesis-configs-admin.request.dto';
import { ArtifactPolicy } from '../domain/artifact-policy.entity';
import { ArtifactPolicyNotFoundException } from '../domain/master.exception';
import { ArtifactPolicyPolicy } from '../domain/artifact-policy.policy';
import { AdvisoryLockService } from 'src/common/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/common/concurrency/concurrency.constants';

/**
 * [Artifact] 유물 합성 설정 수정 서비스 (어드민용)
 */
@Injectable()
export class UpdateArtifactSynthesisConfigsAdminService {
  constructor(
    private readonly policyRepo: ArtifactPolicyRepositoryPort,
    private readonly policyPolicy: ArtifactPolicyPolicy,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  /**
   * 글로벌 유물 정책의 합성 설정 테이블을 수정하고 저장
   */
  @Transactional()
  async execute(dto: UpdateArtifactSynthesisConfigsAdminRequestDto): Promise<ArtifactPolicy> {
    // 동시성 제어: 전역 유물 정책 락 획득 (트랜잭션 종료 시 자동 해제)
    await this.advisoryLockService.acquireLock(LockNamespace.ARTIFACT_MASTER, 'POLICY');

    const policy = await this.policyRepo.findPolicy();
    if (!policy) {
      throw new ArtifactPolicyNotFoundException();
    }

    // 1. 엔티티 상태 변경 (Deep Merge)
    policy.updateSynthesisConfigs(dto.synthesisConfigs);

    // 2. 도메인 정책 검증 (합쳐진 최종 상태 확인)
    this.policyPolicy.validateSynthesisConfigs(policy.synthesisConfigs);

    // 3. 변경사항 저장
    await this.policyRepo.save(policy);

    return policy;
  }
}
