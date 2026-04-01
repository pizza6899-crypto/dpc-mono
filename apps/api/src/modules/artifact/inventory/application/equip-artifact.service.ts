import { Injectable } from '@nestjs/common';
import { UserArtifactNotFoundException, InvalidArtifactSlotException, ArtifactAlreadyEquippedException } from '../domain/inventory.exception';
import { Transactional } from '@nestjs-cls/transactional';
import { UserArtifactRepositoryPort } from '../ports/user-artifact.repository.port';
import { EquipArtifactRequestDto } from '../controllers/user/dto/request/equip-artifact.request.dto';
import { UserArtifactResponseDto } from '../controllers/user/dto/response/user-artifact.response.dto';
import { GetUserArtifactStatusService } from '../../status/application/get-user-artifact-status.service';
import { GetEquippedArtifactStatsService } from './get-equipped-artifact-stats.service';
import { SyncUserTotalStatsService } from 'src/modules/character/status/application/sync-user-total-stats.service';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';

import { RequestContextService } from 'src/infrastructure/cls/request-context.service';
import { AdvisoryLockService } from 'src/infrastructure/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/infrastructure/concurrency/concurrency.constants';

/**
 * [Artifact Inventory] 유물 장착 서비스
 */
@Injectable()
export class EquipArtifactService {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly lockService: AdvisoryLockService,
    private readonly repository: UserArtifactRepositoryPort,
    private readonly statusService: GetUserArtifactStatusService,
    private readonly getEquippedStatsService: GetEquippedArtifactStatsService,
    private readonly syncTotalStatsService: SyncUserTotalStatsService,
    private readonly sqidsService: SqidsService,
  ) { }

  /**
   * 유물을 지정된 슬롯에 장착 (트랜잭션)
   */
  @Transactional()
  async execute(body: EquipArtifactRequestDto): Promise<UserArtifactResponseDto> {
    const userId = this.requestContext.getUserId()!;
    const { userArtifactId: sqid, slotNo } = body;

    // 동시성 제어 (유저별 인벤토리 조작 락)
    await this.lockService.acquireLock(LockNamespace.ARTIFACT_INVENTORY, userId.toString());

    // 1. 유물 식별 및 소유권 확인
    const userArtifactId = this.sqidsService.decode(sqid, SqidsPrefix.USER_ARTIFACT);
    const userArtifact = await this.repository.findById(userArtifactId);

    if (!userArtifact || userArtifact.userId !== userId) {
      throw new UserArtifactNotFoundException();
    }

    // 2. 이미 동일한 슬롯에 장착 중인지 확인
    if (userArtifact.isEquipped && userArtifact.slotNo === slotNo) {
      throw new ArtifactAlreadyEquippedException();
    }

    // 3. 슬롯 유효성(잠금 해제 여부) 확인
    const status = await this.statusService.execute(userId);
    if (slotNo > status.activeSlotCount) {
      throw new InvalidArtifactSlotException();
    }

    // 4. (Swap 로직) 해당 타겟 슬롯에 이미 다른 유물이 있다면 해제
    const existingInTargetSlot = await this.repository.findBySlot(userId, slotNo);
    if (existingInTargetSlot && existingInTargetSlot.id !== userArtifact.id) {
      existingInTargetSlot.unequip();
      await this.repository.update(existingInTargetSlot);
    }

    // 5. 장착 실행 (도메인 메서드 내에서 내부 상태 변경됨)
    userArtifact.equip(slotNo);
    const updated = await this.repository.update(userArtifact);

    // 6. 캐릭터 최종 스탯 동기화 (유물 보너스 합산 반영)
    const bonuses = await this.getEquippedStatsService.execute(userId);
    await this.syncTotalStatsService.execute(userId, bonuses);

    // 7. 결과 반환
    return {
      id: this.sqidsService.encode(updated.id, SqidsPrefix.USER_ARTIFACT),
      artifactCode: updated.catalog?.code || 'UNKNOWN',
      slotNo: updated.slotNo ?? undefined,
      isEquipped: updated.isEquipped,
      grade: updated.catalog?.grade,
      acquiredAt: updated.createdAt,
    };
  }
}
