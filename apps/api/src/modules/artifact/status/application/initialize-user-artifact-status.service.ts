import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserArtifactStatusRepositoryPort } from '../ports/user-artifact-status.repository.port';
import { UserArtifactStatus } from '../domain/user-artifact-status.entity';
import { SyncArtifactSlotService } from './sync-artifact-slot.service';

/**
 * [Artifact Status] 유저의 유물 시스템 상태 초기화 서비스
 * - 유저의 최초 유입 시 (가입/튜토리얼 등) 한 번 호출됩니다.
 * - 레코드를 생성하고 현재 레벨에 맞는 슬롯 동기화를 "최초 1회" 수행합니다.
 */
@Injectable()
export class InitializeUserArtifactStatusService {
  constructor(
    private readonly statusRepo: UserArtifactStatusRepositoryPort,
    private readonly syncSlotService: SyncArtifactSlotService,
  ) { }

  /**
   * 유저의 초기 상태 생성 및 슬롯 레벨 최신화
   */
  @Transactional()
  async execute(userId: bigint): Promise<UserArtifactStatus> {
    let status = await this.statusRepo.findByUserId(userId);

    if (!status) {
      status = await this.statusRepo.upsert(UserArtifactStatus.create(userId));
    }

    // 초기화 시점에 현재 캐릭터 레벨에 매칭되는 슬롯 수를 강제 동기화
    return await this.syncSlotService.execute(userId);
  }
}
