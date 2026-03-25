import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CharacterLogType, ExchangeCurrencyCode, Prisma, UserWalletBalanceType, UserWalletTransactionType } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import {
  USER_CHARACTER_LOG_REPOSITORY_PORT,
} from '../ports';
import type {
  UserCharacterLogRepositoryPort,
} from '../ports';
import {
  GAMIFICATION_CONFIG_REPOSITORY_PORT,
} from '../../catalog/ports/gamification-config.repository.port';
import type { GamificationConfigRepositoryPort } from '../../catalog/ports/gamification-config.repository.port';
import { UpdateUserBalanceService } from '../../../wallet/application/update-user-balance.service';
import { CharacterStatsResetMetadata, UpdateOperation, WalletActionName } from '../../../wallet/domain';
import {
  GamificationCurrencyNotSupportedException
} from '../domain/character.exception';
import { GamificationConfigNotFoundException } from '../../catalog/domain/catalog.exception';
import { UserCharacter } from '../domain/user-character.entity';
import { UserCharacterLog } from '../domain/user-character-log.entity';
import { FindUserCharacterService } from './find-user-character.service';
import { SyncUserTotalStatsService } from './sync-user-total-stats.service';

/**
 * 유저 자발적 스탯 초기화 서비스
 * 
 * 유저가 비용(예: 10,000 KRW)을 지불하고 본인의 스탯을 초기화합니다.
 * 월렛 모듈과 연동하여 잔액을 차감하며, 트랜잭션과 비관적 락을 통해 원자성을 보장합니다.
 */
@Injectable()
export class ResetStatsUserService {
  constructor(
    @Inject(USER_CHARACTER_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserCharacterLogRepositoryPort,

    @Inject(GAMIFICATION_CONFIG_REPOSITORY_PORT)
    private readonly configRepository: GamificationConfigRepositoryPort,

    private readonly findUserCharacterService: FindUserCharacterService,

    private readonly updateUserBalanceService: UpdateUserBalanceService,

    private readonly syncTotalStatsService: SyncUserTotalStatsService,

    private readonly advisoryLockService: AdvisoryLockService,

    private readonly snowflakeService: SnowflakeService,
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
    const character = await this.findUserCharacterService.execute(userId);

    const config = await this.configRepository.findConfig();
    if (!config) {
      throw new GamificationConfigNotFoundException();
    }

    // 3. 해당 통화에 대한 고정 가격 조회
    const price = config.getResetPrice(currency);
    if (!price) {
      throw new GamificationCurrencyNotSupportedException();
    }

    // [임시 무상 정책] 프로모션 기간 동안 비용을 0으로 처리하거나 차감 로직을 스킵합니다.
    const isFreePromotion = true;
    const finalPrice = isFreePromotion ? new Prisma.Decimal(0) : new Prisma.Decimal(price);

    // 초기화 전 스냅샷 저장 (로그용)
    const beforeLevel = character.level;
    const beforeStatPoints = character.statPoints;
    const beforeStats = {
      casinoBenefit: character.casinoBenefit,
      slotBenefit: character.slotBenefit,
      sportsBenefit: character.sportsBenefit,
      minigameBenefit: character.minigameBenefit,
      badBeatJackpot: character.badBeatJackpot,
      criticalJackpot: character.criticalJackpot,
    };

    // 4. 자산 차감 시도 (월렛 서비스 호출)
    // 무상 프로모션 중이 아닐 때만 실제 잔액 차감을 진행합니다.
    if (!isFreePromotion) {
      await this.updateUserBalanceService.updateBalance(
        {
          userId,
          currency,
          amount: finalPrice,
          operation: UpdateOperation.SUBTRACT,
          balanceType: UserWalletBalanceType.CASH,
          transactionType: UserWalletTransactionType.ADJUSTMENT,
        },
        {
          actionName: WalletActionName.CHARACTER_STATS_RESET,
          metadata: {
            reason: 'User Paid Stat Reset',
            cost: finalPrice.toString(),
            currency,
            previousStats: beforeStats,
          } as CharacterStatsResetMetadata,
        },
      );
    }

    // 5. 캐릭터 스탯 초기화 수행
    character.resetStats();

    // 6. [최적화 & 동기화] 변경 사항 영속화 및 최종 스탯 캐시 업데이트
    await this.syncTotalStatsService.sync(character);

    // 7. 초기화 이력 로그 저장
    const { id: logId, timestamp: logTime } = this.snowflakeService.generate();
    const log = UserCharacterLog.create({
      id: logId,
      createdAt: logTime,
      userId: character.userId,
      type: CharacterLogType.STAT_RESET,
      beforeLevel,
      afterLevel: character.level,
      beforeStatPoints,
      afterStatPoints: character.statPoints,
      details: {
        type: 'STAT_RESET',
        cost: finalPrice.toString(),
        currency,
        previousStats: beforeStats,
        resetCount: character.statResetCount,
        isFreePromo: isFreePromotion, // 무상 여부 기록
      },
    });

    await this.logRepo.save(log);

    return character;
  }
}
