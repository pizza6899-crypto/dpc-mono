import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/infrastructure/concurrency';
import { USER_CHARACTER_REPOSITORY_PORT } from '../ports/user-character.repository.port';
import type { UserCharacterRepositoryPort } from '../ports/user-character.repository.port';
import { UserCharacter } from '../domain/user-character.entity';
import type { UserStats } from '../domain/user-character.entity';

/**
 * 유저의 최종 스탯(기본 + 보너스 합산)을 재계산하고 캐시 필드를 업데이트합니다.
 * 
 * 아이템 장착/해제(또는 유물 활성), 레벨업 후 포인트 투자 등 스탯에 변화가 생겼을 때 호출합니다.
 */
@Injectable()
export class SyncUserTotalStatsService {
  constructor(
    @Inject(USER_CHARACTER_REPOSITORY_PORT)
    private readonly characterRepository: UserCharacterRepositoryPort,

    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  /**
   * 유저의 모든 활성 보너스를 합계하여 최종 스탯을 동기화합니다.
   * 
   * @param userId 동기화할 유저 ID
   * @param bonuses (옵션) 타 모듈(유물 등)에서 계산된 총 보너스 스탯
   */
  @Transactional()
  async execute(userId: bigint, bonuses?: UserStats): Promise<void> {
    // 0. 유저별 캐릭터 뮤테이션 권고락 획득 (Read-Aggregate-Write 동시성 제어)
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_CHARACTER,
      userId.toString(),
    );

    // 1. 캐릭터 리로드 (현재 기본 스탯 정보 필요)
    const character = await this.characterRepository.findByUserId(userId);
    if (!character) return;

    // 2. 내부 동기화 로직 호출
    await this.sync(character, bonuses);
  }

  /**
   * 이미 로드된 캐릭터 엔티티를 사용하여 스탯을 동기화하고 영속화합니다.
   * 엔티티가 이미 존재하는 상황에서 중복 쿼리 없이 처리하기 위해 사용합니다.
   */
  @Transactional()
  async sync(character: UserCharacter, bonuses?: UserStats): Promise<void> {
    // 지정된 보너스가 없다면 0으로 초기화
    const appliedBonuses: UserStats = bonuses ?? {
      casinoBenefit: 0,
      slotBenefit: 0,
      sportsBenefit: 0,
      minigameBenefit: 0,
      badBeatJackpot: 0,
      criticalJackpot: 0,
    };

    // 3. 엔티티 내부에 보너스 적용 및 캐시 필드 업데이트
    character.syncTotalStats(appliedBonuses);

    // 4. 저장
    await this.characterRepository.save(character);
  }
}
