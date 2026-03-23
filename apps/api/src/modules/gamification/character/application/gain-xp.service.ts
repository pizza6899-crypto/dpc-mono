import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CharacterLogType } from '@prisma/client';
import { GetGamificationConfigService } from '../../catalog/application/get-gamification-config.service';
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
  ) { }

  /**
   * 유저에게 경험치를 지급하고, 레벨업 조건을 달성했는지 평가합니다.
   * 레벨업 시 도메인 엔티티를 통해 보너스 스탯 포인트를 지급하고 로그를 기록합니다.
   */
  async execute(userId: bigint, xpAmount: Prisma.Decimal): Promise<void> {
    if (xpAmount.lte(0)) return;

    let character = await this.characterRepo.findByUserId(userId);
    
    // 경험치 획득 시 캐릭터가 없으면 자동 생성
    if (!character) {
      character = UserCharacter.create(userId);
    }

    const beforeLevel = character.level;
    const beforeStatPoints = character.statPoints;

    // 1. 경험치 증가
    character.gainXp(xpAmount);

    // 2. 레벨업 평가 (프로젝트 정책에 맞는 테이블/공식 적용 필요)
    // TODO: 게임 기획에 맞는 (Level <-> Required XP) 공식이나 테이블 포석 마련.
    // 임시 공식: 다음 레벨업 요구 XP = 현재 레벨 * 100 (누적치 기준 여부에 따라 로직 상이)
    const requiredXpForNextLevel = new Prisma.Decimal(100 * character.level); 

    let isLeveledUp = false;
    
    // 연속 레벨업을 대비한 while문
    while (character.xp.gte(new Prisma.Decimal(100 * character.level))) {
      const config = await this.getConfigService.execute();
      const requiredXp = new Prisma.Decimal(100 * character.level);
      
      character.levelUp(requiredXp, config.statPointsGrantPerLevel);
      isLeveledUp = true;
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
  }
}
