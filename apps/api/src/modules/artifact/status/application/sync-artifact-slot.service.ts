import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserArtifactStatusRepositoryPort } from '../ports/user-artifact-status.repository.port';
import { UserArtifactStatus } from '../domain/user-artifact-status.entity';
import { FindUserCharacterService } from 'src/modules/character/status/application/find-user-character.service';
import { ArtifactStatusNotFoundException } from '../domain/status.exception';
import { GetArtifactPolicyAdminService } from '../../master/application/get-artifact-policy-admin.service';

/**
 * [Artifact Status] 유저의 유물 슬롯 동기화 서비스
 * - 유저의 현재 레벨과 마스터 정책을 비교하여 활성 슬롯 개수를 최신화합니다.
 */
@Injectable()
export class SyncArtifactSlotService {
  constructor(
    private readonly statusRepo: UserArtifactStatusRepositoryPort,
    private readonly policyService: GetArtifactPolicyAdminService,
    private readonly findCharacterService: FindUserCharacterService,
  ) { }

  /**
   * 유저의 레벨에 기반하여 사용 가능한 유물 슬롯 동기화
   */
  @Transactional()
  async execute(userId: bigint): Promise<UserArtifactStatus> {
    const [status, character, policy] = await Promise.all([
      this.statusRepo.findByUserId(userId),
      this.findCharacterService.execute(userId),
      this.policyService.execute(), // 정책 조회 서비스 호출
    ]);

    if (!status || !character || !policy) {
      if (!status) throw new ArtifactStatusNotFoundException();
      // character나 policy가 없는 경우는 시스템 설정 오류이므로 그대로 반환하거나 로그를 남길 수 있음
      return status;
    }

    // 정책에 따른 기대 슬롯 개수 계산
    const expectedCount = policy.getAvailableSlotCount(character.level);

    // 현재 슬롯보다 기대 슬롯이 많은 경우에만 업데이트 (슬롯 축소는 방지 정책에 따름)
    if (expectedCount > status.activeSlotCount) {
      status.updateActiveSlotCount(expectedCount);
      return await this.statusRepo.update(status);
    }

    return status;
  }
}
