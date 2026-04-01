import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserArtifactRepositoryPort } from '../ports/user-artifact.repository.port';
import { UserStats } from 'src/modules/character/status/domain/user-character.entity';

@Injectable()
export class GetEquippedArtifactStatsService {
  constructor(
    private readonly repository: UserArtifactRepositoryPort,
  ) { }

  /**
   * 유저가 현재 장착 중인 모든 유물의 능력치 합계를 계산합니다.
   */
  @Transactional()
  async execute(userId: bigint): Promise<UserStats> {
    const allArtifacts = await this.repository.findByUserId(userId);
    const equippedOnes = allArtifacts.filter(a => a.isEquipped);

    const totalStats: UserStats = {
      casinoBenefit: 0,
      slotBenefit: 0,
      sportsBenefit: 0,
      minigameBenefit: 0,
      badBeatJackpot: 0,
      criticalJackpot: 0,
    };

    for (const userArtifact of equippedOnes) {
      const stats = userArtifact.catalog?.statsSummary;
      if (!stats) continue;

      totalStats.casinoBenefit += stats.casinoBenefit;
      totalStats.slotBenefit += stats.slotBenefit;
      totalStats.sportsBenefit += stats.sportsBenefit;
      totalStats.minigameBenefit += stats.minigameBenefit;
      
      // 도감의 benefit 명칭을 캐릭터 스탯의 jackpot 명칭으로 매핑
      totalStats.badBeatJackpot += stats.badBeatBenefit;
      totalStats.criticalJackpot += stats.criticalBenefit;
    }

    return totalStats;
  }
}
