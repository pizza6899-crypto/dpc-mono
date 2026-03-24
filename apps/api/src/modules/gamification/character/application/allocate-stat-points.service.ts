import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CharacterLogType } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { GetGamificationConfigService } from '../../catalog/application/get-gamification-config.service';
import { UserCharacter } from '../domain/user-character.entity';
import {
  USER_CHARACTER_LOG_REPOSITORY_PORT,
} from '../ports';
import type {
  UserCharacterLogRepositoryPort
} from '../ports';
import { UserStats } from '../domain/user-character.entity';
import { UserCharacterLog } from '../domain/user-character-log.entity';
import { FindUserCharacterService } from './find-user-character.service';
import { SyncUserTotalStatsService } from './sync-user-total-stats.service';

export interface AllocateStatPointsParams {
  userId: bigint;
  statName: keyof UserStats;
  points: number;
}

@Injectable()
export class AllocateStatPointsService {
  constructor(
    @Inject(USER_CHARACTER_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserCharacterLogRepositoryPort,
    private readonly getConfigService: GetGamificationConfigService,
    private readonly findUserCharacterService: FindUserCharacterService,
    private readonly syncTotalStatsService: SyncUserTotalStatsService,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  @Transactional()
  async execute(params: AllocateStatPointsParams): Promise<UserCharacter> {
    // 1. 유저별 캐릭터 뮤테이션 권고락 획득 (동시성 제어)
    await this.advisoryLockService.acquireLock(
      LockNamespace.GAMIFICATION_CHARACTER,
      params.userId.toString(),
    );

    // 2. 캐릭터 조회 및 락 획득 (FindUserCharacterService에서 수행)
    const character = await this.findUserCharacterService.execute(params.userId);

    const config = await this.getConfigService.execute();

    const beforeLevel = character.level;
    const beforeStatPoints = character.statPoints;

    // 도메인 엔티티 내 투자 로직 실행 (한도 및 가용포인트 검증 포함)
    character.allocateStatPoint(params.statName, params.points, config.maxStatLimit);

    // [최적화] 기본 스탯이 변했으므로 최종 스탯(Base + Bonus)을 동기화하고 영속화합니다.
    // 기존에는 save() 후 다시 execute(userId)를 호출하여 2번 저장했으나, 
    // 이제 sync(character)를 통해 1번의 UPDATE 쿼리로 통합 처리합니다.
    await this.syncTotalStatsService.sync(character);

    // 투자 이력 로그 저장
    const log = UserCharacterLog.create({
      userId: character.userId,
      type: CharacterLogType.STAT_ALLOCATION,
      beforeLevel,
      afterLevel: character.level,
      beforeStatPoints,
      afterStatPoints: character.statPoints,
      details: {
        type: 'STAT_ALLOCATION',
        statName: params.statName,
        investedPoints: params.points,
        afterBaseStat: character[params.statName as keyof UserStats], // 명칭 개선
      },
    });

    await this.logRepo.save(log);

    return character;
  }
}
