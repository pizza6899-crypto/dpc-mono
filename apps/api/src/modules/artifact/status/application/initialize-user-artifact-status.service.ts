import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserArtifactStatusRepositoryPort } from '../ports/user-artifact-status.repository.port';
import { UserArtifactStatus } from '../domain/user-artifact-status.entity';

import { SyncArtifactSlotService } from './sync-artifact-slot.service';

/**
 * [Artifact Status] 유저의 유물 시스템 상태 초기화 서비스
 * - 유입 시 최초 1회 기본 슬롯 및 통계 정보를 생성합니다.
 */
@Injectable()
export class InitializeUserArtifactStatusService {
  constructor(
    private readonly statusRepo: UserArtifactStatusRepositoryPort,
    private readonly syncSlotService: SyncArtifactSlotService,
  ) { }

  /**
   * 유저의 초기 상태 생성 (이미 존재하면 기존 상태 반환)
   */
  @Transactional()
  async execute(userId: bigint): Promise<UserArtifactStatus> {
    let status = await this.statusRepo.findByUserId(userId);

    if (!status) {
      status = await this.statusRepo.upsert(UserArtifactStatus.create(userId));
    }

    // 생성/조회 직후 항상 최신 레벨에 맞춰 슬롯 동기화 수행
    return await this.syncSlotService.execute(userId);
  }
}
