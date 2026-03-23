import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CharacterLogType } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { FindUserCharacterService } from './find-user-character.service';
import {
  USER_CHARACTER_REPOSITORY_PORT,
  USER_CHARACTER_LOG_REPOSITORY_PORT,
} from '../ports';
import type {
  UserCharacterRepositoryPort,
  UserCharacterLogRepositoryPort
} from '../ports';
import { UserCharacter } from '../domain/user-character.entity';
import { UserCharacterLog } from '../domain/user-character-log.entity';

@Injectable()
export class ResetStatsAdminService {
  constructor(
    @Inject(USER_CHARACTER_REPOSITORY_PORT)
    private readonly characterRepo: UserCharacterRepositoryPort,
    @Inject(USER_CHARACTER_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserCharacterLogRepositoryPort,
    private readonly findUserCharacterService: FindUserCharacterService,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  /**
   * 관리자 권한으로 캐릭터 스탯을 초기화합니다. (비용 소모 없음)
   */
  @Transactional()
  async execute(userId: bigint, reason: string): Promise<UserCharacter> {
    // 1. 유저별 캐릭터 뮤테이션 권고락 획득
    await this.advisoryLockService.acquireLock(
      LockNamespace.GAMIFICATION_CHARACTER,
      userId.toString(),
    );

    const character = await this.findUserCharacterService.execute(userId);

    const beforeLevel = character.level;
    const beforeStatPoints = character.statPoints;

    // 2. 도메인 로직 실행 (스탯 초기화 및 포인트 반환)
    character.resetStats();

    // 3. 변경 사항 저장
    await this.characterRepo.save(character);

    // 4. 로그 기록
    const log = UserCharacterLog.create({
      userId: character.userId,
      type: CharacterLogType.STAT_RESET,
      beforeLevel,
      afterLevel: character.level,
      beforeStatPoints,
      afterStatPoints: character.statPoints,
      details: {
        reason: reason || 'ADMIN_FORCED_RESET',
        adminTriggered: true,
      },
    });

    await this.logRepo.save(log);

    return character;
  }
}
