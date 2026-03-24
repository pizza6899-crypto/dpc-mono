import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import { GainXpService } from 'src/modules/gamification/character/application/gain-xp.service';
import { GetGamificationConfigService } from 'src/modules/gamification/catalog/application/get-gamification-config.service';
import { UserWalletTransaction } from 'src/modules/wallet/domain/model/user-wallet-transaction.entity';

/**
 * [Wagering] 베팅-게이미피케이션 통합 서비스
 * 
 * 베팅 활동(Bet, Cancel, Revert)에 따른 경험치(XP) 정산을 전담합니다.
 * 베팅 엔진의 각 서비스에서 직접 수식을 계산하는 대신 이 서비스를 호출하여 정합성을 유지합니다.
 */
@Injectable()
export class WageringXpIntegrationService {
  private readonly logger = new Logger(WageringXpIntegrationService.name);

  constructor(
    private readonly gainXpService: GainXpService,
    private readonly getGamificationConfigService: GetGamificationConfigService,
  ) { }

  /**
   * 베팅액에 비례하여 경험치를 지급합니다 (Positive XP)
   */
  async grantXpByBet(
    userId: bigint,
    amount: Prisma.Decimal,
    currency: ExchangeCurrencyCode,
    usdExchangeRate?: Prisma.Decimal,
    referenceId?: bigint,
  ): Promise<void> {
    await this.processXp(userId, amount, currency, usdExchangeRate, 'GRANT', referenceId);
  }

  /**
   * 베팅 취소/무효에 따라 경험치를 회수합니다 (Negative XP)
   */
  async revertXpByRefund(
    userId: bigint,
    amount: Prisma.Decimal,
    currency: ExchangeCurrencyCode,
    usdExchangeRate?: Prisma.Decimal,
    referenceId?: bigint,
  ): Promise<void> {
    await this.processXp(userId, amount, currency, usdExchangeRate, 'REVERT', referenceId);
  }

  /**
   * 트랜잭션 비율 기반 경험치 회수 (RevertWageringContribution 전용)
   */
  async revertXpByTxRatio(
    userId: bigint,
    revertRatio: Prisma.Decimal,
    betTxs: UserWalletTransaction[],
    referenceId?: bigint,
  ): Promise<void> {
    try {
      // 1. 원본 베팅의 총 금액 합산 (현지 통화 기준)
      let totalBetAmount = new Prisma.Decimal(0);
      let representativeRate: Prisma.Decimal | undefined;

      for (const tx of betTxs) {
        totalBetAmount = totalBetAmount.add(tx.amount.abs());
        
        // 메타데이터 등에서 환율 정보가 있다면 추출 (없으면 현지 통화 비율로만 계산)
        const metadata = tx.metadata as any;
        if (metadata?.exchangeRate && !representativeRate) {
          representativeRate = new Prisma.Decimal(metadata.exchangeRate);
        }
      }

      if (totalBetAmount.isZero()) return;

      // 2. 취소 비율만큼의 현지 통화 금액 산출
      const revertAmount = totalBetAmount.mul(revertRatio);
      const currency = betTxs[0]?.currency;

      if (revertAmount.gt(0) && currency) {
        await this.processXp(userId, revertAmount, currency, representativeRate, 'REVERT', referenceId);
      }
    } catch (error) {
      this.logger.error(`[WageringXpIntegration] Failed to revert XP by ratio for user ${userId}`, error);
    }
  }

  /**
   * 경험치 정산 공통 처리 로직
   */
  private async processXp(
    userId: bigint,
    amount: Prisma.Decimal,
    currency: ExchangeCurrencyCode,
    usdExchangeRate: Prisma.Decimal | undefined,
    action: 'GRANT' | 'REVERT',
    referenceId?: bigint,
  ): Promise<void> {
    try {
      if (amount.lte(0)) return;

      const config = await this.getGamificationConfigService.execute();

      // 1. USD 환산 금액 계산
      const amountUsd = currency === 'USD'
        ? amount
        : (usdExchangeRate && !usdExchangeRate.isZero() ? amount.mul(usdExchangeRate) : new Prisma.Decimal(0));

      if (amountUsd.isZero()) return;

      // 2. 지급/회수할 XP량 계산 (Multiplier 적용)
      const xpAmount = amountUsd.mul(config.xpGrantMultiplierUsd);

      if (xpAmount.gt(0)) {
        // GRANT일 때는 양수, REVERT일 때는 음수로 지급
        const finalXp = action === 'GRANT' ? xpAmount : xpAmount.negated();
        await this.gainXpService.execute(userId, finalXp, referenceId);
      }
    } catch (error) {
      // 게이미피케이션 정산 실패가 원문 베팅 로직에 치명적 영향을 주지 않도록 로깅 후 무시
      this.logger.error(`[WageringXpIntegration] Failed to ${action} XP for user ${userId}. amount=${amount}`, error);
    }
  }
}
