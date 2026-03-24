import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { USER_CHARACTER_REPOSITORY_PORT } from '../ports/user-character.repository.port';
import type { UserCharacterRepositoryPort } from '../ports/user-character.repository.port';
import { USER_INVENTORY_REPOSITORY_PORT } from '../../inventory/ports/user-inventory.repository.port';
import type { UserInventoryRepositoryPort } from '../../inventory/ports/user-inventory.repository.port';
import { UserStats } from '../domain/user-character.entity';
import { EffectType } from '@prisma/client';

/**
 * 유저의 최종 스탯(기본 + 보너스 합산)을 재계산하고 캐시 필드를 업데이트합니다.
 * 
 * 아이템 장착/해제, 레벨업 후 포인트 투자 등 스탯에 변화가 생겼을 때 호출합니다.
 */
@Injectable()
export class SyncUserTotalStatsService {
  constructor(
    @Inject(USER_CHARACTER_REPOSITORY_PORT)
    private readonly characterRepository: UserCharacterRepositoryPort,

    @Inject(USER_INVENTORY_REPOSITORY_PORT)
    private readonly inventoryRepository: UserInventoryRepositoryPort,

    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  /**
   * 유저의 모든 활성 보너스를 합계하여 최종 스탯을 동기화합니다.
   * 
   * @param userId 동기화할 유저 ID
   */
  @Transactional()
  async execute(userId: bigint): Promise<void> {
    // 0. 유저별 캐릭터 뮤테이션 권고락 획득 (Read-Aggregate-Write 동시성 제어)
    await this.advisoryLockService.acquireLock(
      LockNamespace.GAMIFICATION_CHARACTER,
      userId.toString(),
    );

    // 1. 캐릭터 리로드 (현재 기본 스탯 정보 필요)
    const character = await this.characterRepository.findByUserId(userId);
    if (!character) return;

    // 2. 현재 활성 상태(장착중 등)인 아이템 효과 목록 조회
    const activeItems = await this.inventoryRepository.findActiveBonuses(userId);

    // 3. STAT_BOOST 유형의 효과를 스탯별 합산
    const bonuses: UserStats = {
      strength: 0,
      agility: 0,
      luck: 0,
      wisdom: 0,
      stamina: 0,
      charisma: 0,
    };

    for (const item of activeItems) {
      if (!Array.isArray(item.effects)) continue;

      for (const effect of item.effects) {
        if (effect.type === EffectType.STAT_BOOST && effect.target) {
          const statKey = this.mapTargetToStatKey(effect.target);
          if (statKey && statKey in bonuses) {
            bonuses[statKey as keyof UserStats] += Number(effect.value || 0);
          }
        }
      }
    }

    // 4. 엔티티 내부에 보너스 적용 및 캐시 필드 업데이트
    character.syncTotalStats(bonuses);

    // 5. 저장
    await this.characterRepository.save(character);
  }

  /**
   * 메타데이터의 타겟 문자열을 엔티티 스탯 키로 매핑
   */
  private mapTargetToStatKey(target: string): string | null {
    const targetLower = target.toLowerCase();

    // 타겟 명칭 유연성 확보 (STR, Strength 등)
    if (targetLower === 'str' || targetLower === 'strength') return 'strength';
    if (targetLower === 'dex' || targetLower === 'agility') return 'agility';
    if (targetLower === 'luc' || targetLower === 'luck') return 'luck';
    if (targetLower === 'int' || targetLower === 'wisdom') return 'wisdom';
    if (targetLower === 'vit' || targetLower === 'stamina') return 'stamina';
    if (targetLower === 'cha' || targetLower === 'charisma') return 'charisma';

    return null;
  }
}
