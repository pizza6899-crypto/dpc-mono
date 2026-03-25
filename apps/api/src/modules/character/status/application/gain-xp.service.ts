import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, CharacterLogType } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { GetCharacterConfigService } from '../../master/application/get-character-config.service';
import { GetLevelDefinitionListService } from '../../master/application/get-level-definition-list.service';
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
export class GainXpService {
  constructor(
    @Inject(USER_CHARACTER_REPOSITORY_PORT)
    private readonly characterRepo: UserCharacterRepositoryPort,
    @Inject(USER_CHARACTER_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserCharacterLogRepositoryPort,
    private readonly getConfigService: GetCharacterConfigService,
    private readonly findUserCharacterService: FindUserCharacterService,
    private readonly levelDefinitionService: GetLevelDefinitionListService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  /**
   * 유저에게 경험치를 지급하고, 레벨업 조건을 달성했는지 평가합니다.
   * 레벨업 시 도메인 엔티티를 통해 보너스 스탯 포인트를 지급하고 로그를 기록합니다.
   */
  @Transactional()
  async execute(
    userId: bigint,
    xpAmount: Prisma.Decimal,
    referenceId?: bigint
  ): Promise<UserCharacter> {
    // 1. 유저별 캐릭터 뮤테이션 권고락 획득 (동시성 제어)
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_CHARACTER,
      userId.toString(),
    );

    const character = await this.findUserCharacterService.execute(userId);

    // 0일 경우 중단
    if (xpAmount.isZero()) return character;

    const beforeLevel = character.level;
    const beforeStatPoints = character.statPoints;

    // 1. 경험치 증가 (음수일 경우 차감, 도메인에서 0 이하로 떨어지지 않게 보호)
    character.gainXp(xpAmount);

    let isLeveledUp = false;

    // 2. 레벨업 평가 (카탈로그 모듈의 레벨 정의 데이터 기반, 경험치가 올랐을 때만)
    if (xpAmount.isPositive()) {
      const levelDefinitions = await this.levelDefinitionService.execute();
      const config = await this.getConfigService.execute();

      // 빠른 조회를 위해 레벨별 Map 생성
      const levelMap = new Map(levelDefinitions.map((def) => [def.level, def]));

      // 레벨업 가능 여부를 순차적으로 확인 (현재 레벨 + 1)
      while (true) {
        const nextLevel = character.level + 1;
        const nextLevelDef = levelMap.get(nextLevel);

        // 다음 레벨 정의가 없거나, 경험치 요건을 충족하지 못하면 브레이크
        if (!nextLevelDef || character.xp.lt(nextLevelDef.requiredXp)) {
          break;
        }

        // 보너스 스탯 포인트 결정
        const pointsToGrant = nextLevelDef.statPointsBoost > 0
          ? nextLevelDef.statPointsBoost
          : config.statPointsGrantPerLevel;

        // 실제 레벨업 수행
        character.levelUp(nextLevelDef.requiredXp, pointsToGrant);
        isLeveledUp = true;
      }
    }

    // 3. 경험치 변동 감사 로그 기록 (항상 기록)
    const isRevert = xpAmount.isNegative();
    const actionType = isRevert ? CharacterLogType.REVERT_XP : CharacterLogType.GAIN_XP;

    const { id: logId, timestamp: logTime } = this.snowflakeService.generate();
    const gainLog = UserCharacterLog.create({
      id: logId,
      createdAt: logTime,
      userId: character.userId,
      type: actionType,
      beforeLevel,
      afterLevel: character.level, // 레벨업 확인 전 상위 스냅샷
      beforeStatPoints,
      afterStatPoints: character.statPoints,
      amount: xpAmount,
      referenceId: referenceId,
      details: {
        type: isRevert ? 'REVERT_XP' : 'GAIN_XP',
        currentXp: character.xp.toString(),
      },
    });
    await this.logRepo.save(gainLog);

    // 4. 실제로 레벨업이 일어났다면 추가 로그 기록
    if (isLeveledUp) {
      const { id: lvLogId, timestamp: lvLogTime } = this.snowflakeService.generate();
      const levelUpLog = UserCharacterLog.create({
        id: lvLogId,
        createdAt: lvLogTime,
        userId: character.userId,
        type: CharacterLogType.LEVEL_UP,
        beforeLevel,
        afterLevel: character.level,
        beforeStatPoints,
        afterStatPoints: character.statPoints,
        details: {
          type: 'LEVEL_UP',
          totalEarnedXp: xpAmount.toString(),
          reason: 'LEVEL_UP_REACHED',
        },
      });
      await this.logRepo.save(levelUpLog);
    }

    // 4. 최종 영속화
    await this.characterRepo.save(character);

    return character;
  }
}
