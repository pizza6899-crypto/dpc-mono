import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CharacterLogType, ExchangeCurrencyCode, Prisma, UserWalletBalanceType, UserWalletTransactionType } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import {
  USER_CHARACTER_REPOSITORY_PORT,
  USER_CHARACTER_LOG_REPOSITORY_PORT,
} from '../ports';
import type {
  UserCharacterRepositoryPort,
  UserCharacterLogRepositoryPort,
} from '../ports';
import {
  GAMIFICATION_CONFIG_REPOSITORY_PORT,
} from '../../catalog/ports/gamification-config.repository.port';
import type { GamificationConfigRepositoryPort } from '../../catalog/ports/gamification-config.repository.port';
import { UpdateUserBalanceService } from '../../../wallet/application/update-user-balance.service';
import { CharacterStatsResetMetadata, UpdateOperation, WalletActionName } from '../../../wallet/domain';
import {
  UserCharacterNotFoundException,
  GamificationCurrencyNotSupportedException
} from '../domain/character.exception';
import { GamificationConfigNotFoundException } from '../../catalog/domain/catalog.exception';
import { UserCharacter } from '../domain/user-character.entity';
import { UserCharacterLog } from '../domain/user-character-log.entity';

/**
 * 유저 자발적 스탯 초기화 서비스
 * 
 * 유저가 비용(예: 10,000 KRW)을 지불하고 본인의 스탯을 초기화합니다.
 * 월렛 모듈과 연동하여 잔액을 차감하며, 트랜잭션과 비관적 락을 통해 원자성을 보장합니다.
 */
@Injectable()
export class ResetStatsUserService {
  constructor(
    @Inject(USER_CHARACTER_REPOSITORY_PORT)
    private readonly repository: UserCharacterRepositoryPort,

    @Inject(USER_CHARACTER_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserCharacterLogRepositoryPort,

    @Inject(GAMIFICATION_CONFIG_REPOSITORY_PORT)
    private readonly configRepository: GamificationConfigRepositoryPort,

    private readonly updateUserBalanceService: UpdateUserBalanceService,

    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  /**
   * 유저 캐릭터의 스탯을 초기화합니다.
   * 
   * @param userId 초기화할 유저 ID
   * @param currency 유저의 대표 통화 (세션에서 전달받음)
   */
  @Transactional()
  async execute(userId: bigint, currency: ExchangeCurrencyCode): Promise<UserCharacter> {
    // 1. 유저별 캐릭터 뮤테이션 권고락 획득 (동시성 제어 - 중복 결제 방지)
    // 캐릭터 정보 수정과 자산 차감이 동시에 일어나므로 반드시 락이 필요합니다.
    await this.advisoryLockService.acquireLock(
      LockNamespace.GAMIFICATION_CHARACTER,
      userId.toString(),
    );

    // 2. 캐릭터 정보 및 설정을 조회
    const character = await this.repository.findByUserId(userId);
    if (!character) {
      throw new UserCharacterNotFoundException();
    }

    const config = await this.configRepository.findConfig();
    if (!config) {
      throw new GamificationConfigNotFoundException();
    }

    // 3. 해당 통화에 대한 고정 가격 조회
    const price = config.getResetPrice(currency);
    if (!price) {
      throw new GamificationCurrencyNotSupportedException();
    }

    // 초기화 전 스냅샷 저장 (로그용)
    const beforeLevel = character.level;
    const beforeStatPoints = character.statPoints;
    const beforeStats = {
      strength: character.strength,
      agility: character.agility,
      luck: character.luck,
      wisdom: character.wisdom,
      stamina: character.stamina,
      charisma: character.charisma,
    };

    // 4. 자산 차감 시도 (월렛 서비스 호출)
    // 월렛 서비스가 내부적으로 잔액 부족 검증 및 차감을 수행합니다.
    await this.updateUserBalanceService.updateBalance(
      {
        userId,
        currency,
        amount: new Prisma.Decimal(price),
        operation: UpdateOperation.SUBTRACT,
        balanceType: UserWalletBalanceType.CASH,
        transactionType: UserWalletTransactionType.ADJUSTMENT,
      },
      {
        actionName: WalletActionName.CHARACTER_STATS_RESET,
        metadata: {
          reason: 'User Paid Stat Reset',
          cost: price.toString(),
          currency,
          previousStats: beforeStats,
        } as CharacterStatsResetMetadata,
      },
    );

    // 5. 캐릭터 스탯 초기화 수행
    character.resetStats();

    // 6. 변경사항 영속화
    await this.repository.save(character);

    // 7. 초기화 이력 로그 저장
    const log = UserCharacterLog.create({
      userId: character.userId,
      type: CharacterLogType.STAT_RESET,
      beforeLevel,
      afterLevel: character.level, // 초기화 시 레벨은 변하지 않음
      beforeStatPoints,
      afterStatPoints: character.statPoints,
      details: {
        cost: price.toString(),
        currency,
        previousStats: beforeStats,
        resetCount: character.statResetCount,
      },
    });

    await this.logRepo.save(log);

    return character;
  }
}
