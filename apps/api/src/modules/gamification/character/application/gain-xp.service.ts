import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, CharacterLogType } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { GetGamificationConfigService } from '../../catalog/application/get-gamification-config.service';
import { GetLevelDefinitionListService } from '../../catalog/application/get-level-definition-list.service';
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
    private readonly getConfigService: GetGamificationConfigService,
    private readonly findUserCharacterService: FindUserCharacterService,
    private readonly levelDefinitionService: GetLevelDefinitionListService,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  /**
   * 유저에게 경험치를 지급하고, 레벨업 조건을 달성했는지 평가합니다.
   * 레벨업 시 도메인 엔티티를 통해 보너스 스탯 포인트를 지급하고 로그를 기록합니다.
   */
  @Transactional()
  async execute(userId: bigint, xpAmount: Prisma.Decimal): Promise<UserCharacter> {
    // 1. 유저별 캐릭터 뮤테이션 권고락 획득 (동시성 제어)
    await this.advisoryLockService.acquireLock(
      LockNamespace.GAMIFICATION_CHARACTER,
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

      // 현재 레벨보다 높은 레벨 정의들을 오름차순으로 확인하여 레벨업 가능 여부 판단
      const nextLevels = levelDefinitions
        .filter((l) => l.level > character.level)
        .sort((a, b) => a.level - b.level);

      for (const nextLevelDef of nextLevels) {
        // 다음 레벨 도달에 필요한 경험치를 충족했는지 확인
        if (character.xp.gte(nextLevelDef.requiredXp)) {
          // 보너스 스탯 포인트: 레벨 정의에 설정된 값이 있으면 우선 사용, 없으면 전역 설정값 사용
          const pointsToGrant = nextLevelDef.statPointsBoost > 0
            ? nextLevelDef.statPointsBoost
            : config.statPointsGrantPerLevel;

          character.levelUp(nextLevelDef.requiredXp, pointsToGrant);
          isLeveledUp = true;
        } else {
          // 다음 레벨 요건을 충족하지 못하면 중단 (레벨은 순차적이므로)
          break;
        }
      }
    }

    // 3. 레벨업이 실제로 일어났다면 로그 기록
    if (isLeveledUp) {
      const log = UserCharacterLog.create({
        userId: character.userId,
        type: CharacterLogType.LEVEL_UP,
        beforeLevel,
        afterLevel: character.level,
        beforeStatPoints,
        afterStatPoints: character.statPoints,
        details: {
          totalEarnedXp: xpAmount.toString(),
          reason: 'XP_GAIN_AND_LEVEL_UP',
        },
      });
      await this.logRepo.save(log);
    }

    // 4. 최종 영속화
    await this.characterRepo.save(character);

    return character;
  }
}
