import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/infrastructure/concurrency';
import { GainXpService } from './gain-xp.service';
import { GetCharacterConfigService } from '../../master/application/get-character-config.service';
import { UserWalletTransaction } from 'src/modules/wallet/domain/model/user-wallet-transaction.entity';
import { USER_CHARACTER_LOG_REPOSITORY_PORT } from '../ports/user-character-log.repository.port';
import type { UserCharacterLogRepositoryPort } from '../ports/user-character-log.repository.port';
import { CharacterLogType } from '@prisma/client';

/**
 * [Character] 베팅 활동에 따른 캐릭터 성장(경험치) 처리 서비스
 * 
 * 와저링 모듈에서 발생하는 활동을 해석하여 게이미피케이션 정책에 맞는 
 * 캐릭터의 성장 수치(XP)를 정산하고 기록합니다.
 */
@Injectable()
export class WageringProgressionService {
  private readonly logger = new Logger(WageringProgressionService.name);

  constructor(
    private readonly gainXpService: GainXpService,
    private readonly getCharacterConfigService: GetCharacterConfigService,
    @Inject(USER_CHARACTER_LOG_REPOSITORY_PORT)
    private readonly characterLogRepo: UserCharacterLogRepositoryPort,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  /**
   * 베팅 성공에 따른 경험치 지급
   */
  async grantXpByBet(
    userId: bigint,
    amountUsd: Prisma.Decimal,
    referenceId?: bigint,
  ): Promise<void> {
    await this.processXp(userId, amountUsd, 'GRANT', referenceId);
  }

  /**
   * 베팅 취소/무효에 따른 경험치 회수 (로그 기반 정밀 회수)
   * 
   * [Concurrency] 동일 referenceId에 대해 동시에 여러 회수 요청이 올 경우를 대비하여
   * 유저 캐릭터 락과 트랜잭션을 적용합니다.
   */
  @Transactional()
  async revertXpByRefund(
    userId: bigint,
    referenceId: bigint,
  ): Promise<void> {
    try {
      // 0. 유저별 캐릭터 뮤테이션 권고락 획득 (Revert 로직의 원자성 보장)
      await this.advisoryLockService.acquireLock(
        LockNamespace.USER_CHARACTER,
        userId.toString(),
      );

      // 1. 해당 라운드(referenceId)로 기록된 모든 로그 조회 (지급 및 회수 포함)
      // Lock을 획득한 후 조회해야 다른 Thread의 Revert 결과를 정확히 반영할 수 있습니다.
      const logs = await this.characterLogRepo.findByReferenceId(referenceId);

      // 2. 현재까지의 순수 지급량 합산 (GAIN_XP + REVERT_XP)
      let netGrantedXp = new Prisma.Decimal(0);
      for (const log of logs) {
        if ((log.type === CharacterLogType.GAIN_XP || log.type === CharacterLogType.REVERT_XP) && log.amount) {
          netGrantedXp = netGrantedXp.add(log.amount);
        }
      }

      // 3. 아직 회수되지 않은 잔량이 있는 경우에만 정확하게 회수
      if (netGrantedXp.gt(0)) {
        await this.gainXpService.execute(userId, netGrantedXp.negated(), referenceId);
      }
    } catch (error) {
      this.logger.error(`[WageringProgression] Failed to revert XP by refund for user ${userId}. referenceId=${referenceId}`, error);
      throw error; // 트랜잭션 롤백을 위해 throw 유지
    }
  }

  /**
   * 트랜잭션 비율 기반 경험치 회수 (Push/부분 무효화 대응)
   */
  async revertXpByTxRatio(
    userId: bigint,
    revertRatio: Prisma.Decimal,
    betTxs: UserWalletTransaction[],
    referenceId?: bigint,
  ): Promise<void> {
    try {
      // 1. 원본 베팅의 총 금액 합산
      let totalBetAmount = new Prisma.Decimal(0);
      let representativeRate: Prisma.Decimal | undefined;

      for (const tx of betTxs) {
        totalBetAmount = totalBetAmount.add(tx.amount.abs());

        const metadata = tx.metadata as any;
        if (metadata?.exchangeRate && !representativeRate) {
          representativeRate = new Prisma.Decimal(metadata.exchangeRate);
        }
      }

      if (totalBetAmount.isZero()) return;

      // 2. 취소 비율만큼의 USD 금액 산출
      const revertAmount = totalBetAmount.mul(revertRatio);
      const currency = betTxs[0]?.currency;

      if (revertAmount.gt(0) && currency) {
        const revertUsd = representativeRate && !representativeRate.isZero()
          ? revertAmount.mul(representativeRate)
          : (currency === 'USD' ? revertAmount : new Prisma.Decimal(0));

        await this.processXp(userId, revertUsd, 'REVERT', referenceId);
      }
    } catch (error) {
      this.logger.error(`[WageringProgression] Failed to revert XP by ratio for user ${userId}`, error);
    }
  }

  /**
   * 성장 정책 기반 경험치 정산 공통 처리
   */
  private async processXp(
    userId: bigint,
    amountUsd: Prisma.Decimal,
    action: 'GRANT' | 'REVERT',
    referenceId?: bigint,
  ): Promise<void> {
    try {
      if (amountUsd.lte(0)) return;

      const config = await this.getCharacterConfigService.execute();

      // 경험치량 계산 (확정 알고리즘)
      const xpAmount = amountUsd.mul(config.xpGrantMultiplierUsd);

      if (xpAmount.gt(0)) {
        const finalXp = action === 'GRANT' ? xpAmount : xpAmount.negated();
        await this.gainXpService.execute(userId, finalXp, referenceId);
      }
    } catch (error) {
      this.logger.error(`[WageringProgression] Failed to ${action} XP for user ${userId}. amountUsd=${amountUsd}`, error);
    }
  }
}
