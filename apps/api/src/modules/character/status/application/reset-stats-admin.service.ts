import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CharacterLogType } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/infrastructure/concurrency';
import { SnowflakeService } from 'src/infrastructure/snowflake/snowflake.service';
import { FindUserCharacterService } from './find-user-character.service';
import {
  USER_CHARACTER_LOG_REPOSITORY_PORT,
} from '../ports';
import type {
  UserCharacterLogRepositoryPort
} from '../ports';
import { UserCharacter } from '../domain/user-character.entity';
import { UserCharacterLog } from '../domain/user-character-log.entity';
import { SyncUserTotalStatsService } from './sync-user-total-stats.service';

@Injectable()
export class ResetStatsAdminService {
  constructor(
    @Inject(USER_CHARACTER_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserCharacterLogRepositoryPort,
    private readonly findUserCharacterService: FindUserCharacterService,
    private readonly syncTotalStatsService: SyncUserTotalStatsService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  /**
   * 관리자 권한으로 캐릭터 스탯을 초기화합니다. (비용 소모 없음)
   */
  @Transactional()
  async execute(userId: bigint, reason: string): Promise<UserCharacter> {
    // 1. 유저별 캐릭터 뮤테이션 권고락 획득
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_CHARACTER,
      userId.toString(),
    );

    const character = await this.findUserCharacterService.execute(userId);

    const beforeLevel = character.level;
    const beforeStatPoints = character.statPoints;

    // 2. 도메인 로직 실행 (스탯 초기화 및 포인트 반환)
    character.resetStats();

    // 3. [최적화 & 동기화] 변경 사항 영속화 및 최종 스탯 캐시 업데이트
    await this.syncTotalStatsService.sync(character);

    // 4. 로그 기록
    const { id: logId, timestamp: logTime } = this.snowflakeService.generate();
    const log = UserCharacterLog.create({
      id: logId,
      createdAt: logTime,
      userId: character.userId,
      type: CharacterLogType.STAT_RESET,
      beforeLevel,
      afterLevel: character.level,
      beforeStatPoints,
      afterStatPoints: character.statPoints,
      details: {
        type: 'STAT_RESET',
        resetCount: character.statResetCount,
        reason: reason || 'ADMIN_FORCED_RESET',
        adminTriggered: true,
      },
    });

    await this.logRepo.save(log);

    return character;
  }
}
