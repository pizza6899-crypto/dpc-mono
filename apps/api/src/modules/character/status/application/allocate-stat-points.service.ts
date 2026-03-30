import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CharacterLogType } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/infrastructure/concurrency';
import { SnowflakeService } from 'src/infrastructure/snowflake/snowflake.service';
import { GetCharacterConfigService } from '../../master/application/get-character-config.service';
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
  mode: 'INC' | 'DEC' | 'MAX';
}

@Injectable()
export class AllocateStatPointsService {
  constructor(
    @Inject(USER_CHARACTER_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserCharacterLogRepositoryPort,
    private readonly getConfigService: GetCharacterConfigService,
    private readonly findUserCharacterService: FindUserCharacterService,
    private readonly syncTotalStatsService: SyncUserTotalStatsService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  @Transactional()
  async execute(params: AllocateStatPointsParams): Promise<UserCharacter> {
    // 1. 유저별 캐릭터 뮤테이션 권고락 획득 (동시성 제어)
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_CHARACTER,
      params.userId.toString(),
    );

    // 2. 캐릭터 조회 및 락 획득 (FindUserCharacterService에서 수행)
    const character = await this.findUserCharacterService.execute(params.userId);

    const config = await this.getConfigService.execute();

    const beforeLevel = character.level;
    const beforeStatPoints = character.statPoints;
    const beforeBaseStat = character[params.statName as keyof UserStats];

    // 투자 모드에 따른 분기 처리
    switch (params.mode) {
      case 'DEC':
        character.decrementStatPoint(params.statName);
        break;
      case 'MAX':
        character.allocateMaxStatPoint(params.statName, config.maxStatLimit);
        break;
      case 'INC':
      default:
        character.allocateStatPoint(params.statName, params.points, config.maxStatLimit);
        break;
    }

    // 실제 변동된 포인트 계산 (로그용)
    const afterStatPoints = character.statPoints;
    const actualInvestedPoints = beforeStatPoints - afterStatPoints;

    // [최적화] 기본 스탯이 변했으므로 최종 스탯(Base + Bonus)을 동기화하고 영속화합니다.
    // 기존에는 save() 후 다시 execute(userId)를 호출하여 2번 저장했으나, 
    // 이제 sync(character)를 통해 1번의 UPDATE 쿼리로 통합 처리합니다.
    await this.syncTotalStatsService.sync(character);

    // 투자 이력 로그 저장
    const { id: logId, timestamp: logTime } = this.snowflakeService.generate();
    const log = UserCharacterLog.create({
      id: logId,
      createdAt: logTime,
      userId: character.userId,
      type: CharacterLogType.STAT_ALLOCATION,
      beforeLevel,
      afterLevel: character.level,
      beforeStatPoints,
      afterStatPoints: character.statPoints,
      details: {
        type: 'STAT_ALLOCATION',
        mode: params.mode,
        statName: params.statName,
        beforeBaseStat: beforeBaseStat,
        investedPoints: actualInvestedPoints,
        afterBaseStat: character[params.statName as keyof UserStats],
      },
    });

    await this.logRepo.save(log);

    return character;
  }
}
