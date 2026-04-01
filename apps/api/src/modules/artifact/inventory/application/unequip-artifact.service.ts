import { Injectable } from '@nestjs/common';
import { UserArtifactNotFoundException } from '../domain/inventory.exception';
import { Transactional } from '@nestjs-cls/transactional';
import { UserArtifactRepositoryPort } from '../ports/user-artifact.repository.port';
import { UnequipArtifactRequestDto } from '../controllers/user/dto/request/unequip-artifact.request.dto';
import { RequestContextService } from 'src/infrastructure/cls/request-context.service';
import { AdvisoryLockService } from 'src/infrastructure/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/infrastructure/concurrency/concurrency.constants';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';
import { GetEquippedArtifactStatsService } from './get-equipped-artifact-stats.service';
import { SyncUserTotalStatsService } from 'src/modules/character/status/application/sync-user-total-stats.service';

/**
 * [Artifact Inventory] 유물 장착 해제 서비스
 */
@Injectable()
export class UnequipArtifactService {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly lockService: AdvisoryLockService,
    private readonly repository: UserArtifactRepositoryPort,
    private readonly sqidsService: SqidsService,
    private readonly getEquippedStatsService: GetEquippedArtifactStatsService,
    private readonly syncTotalStatsService: SyncUserTotalStatsService,
  ) { }

  /**
   * 유물의 장착을 해제 (트랜잭션)
   */
  @Transactional()
  async execute(body: UnequipArtifactRequestDto): Promise<boolean> {
    const userId = this.requestContext.getUserId()!;
    const { userArtifactId: sqid } = body;

    // 동시성 제어 (유저별 인벤토리 조작 락)
    await this.lockService.acquireLock(LockNamespace.ARTIFACT_INVENTORY, userId.toString());

    // 1. 유물 식별 및 소유권 확인
    const userArtifactId = this.sqidsService.decode(sqid, SqidsPrefix.USER_ARTIFACT);
    const userArtifact = await this.repository.findById(userArtifactId);

    if (!userArtifact || userArtifact.userId !== userId) {
      throw new UserArtifactNotFoundException();
    }

    // 2. 이미 해제된 상태라면 패스 (또는 멱등성 유지)
    if (!userArtifact.isEquipped) {
      return true;
    }

    // 3. 해제 실행 및 저장
    userArtifact.unequip();
    await this.repository.update(userArtifact);

    // 4. 캐릭터 최종 스탯 동기화 (유물 보너스 변동 반영)
    const bonuses = await this.getEquippedStatsService.execute(userId);
    await this.syncTotalStatsService.execute(userId, bonuses);

    return true;
  }
}
