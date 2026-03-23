import { Inject, Injectable } from '@nestjs/common';
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
import { UserStats } from '../domain/user-character.entity';
import { UserCharacterLog } from '../domain/user-character-log.entity';
import { UserCharacterNotFoundException } from '../domain/character.exception';

export interface AllocateStatPointsParams {
  userId: bigint;
  statName: keyof UserStats;
  points: number;
}

@Injectable()
export class AllocateStatPointsService {
  constructor(
    @Inject(USER_CHARACTER_REPOSITORY_PORT)
    private readonly characterRepo: UserCharacterRepositoryPort,
    @Inject(USER_CHARACTER_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserCharacterLogRepositoryPort,
    private readonly getConfigService: GetGamificationConfigService,
  ) { }

  /**
   * 스탯 포인트를 특정 능력치에 투자합니다.
   */
  async execute(params: AllocateStatPointsParams): Promise<void> {
    const character = await this.characterRepo.findByUserId(params.userId);
    if (!character) {
      throw new UserCharacterNotFoundException();
    }

    const config = await this.getConfigService.execute();

    const beforeLevel = character.level;
    const beforeStatPoints = character.statPoints;

    // 도메인 엔티티 내 투자 로직 실행 (한도 및 가용포인트 검증 포함)
    character.allocateStatPoint(params.statName, params.points, config.maxStatLimit);

    // 변경된 스탯 저장
    await this.characterRepo.save(character);

    // 투자 이력 로그 저장
    const log = UserCharacterLog.create({
      userId: character.userId,
      type: CharacterLogType.STAT_ALLOCATION,
      beforeLevel,
      afterLevel: character.level, // 이 액션에서는 변하지 않음
      beforeStatPoints,
      afterStatPoints: character.statPoints,
      details: {
        statName: params.statName,
        investedPoints: params.points,
        totalStatIncrse: character[params.statName as keyof UserStats], // 조회용
      },
    });

    await this.logRepo.save(log);
  }
}
