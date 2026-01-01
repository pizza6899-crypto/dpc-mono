import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  DcsResponseCode,
  getDcsResponse,
} from 'src/modules/casino/dcs/constants/dcs-response-codes';
import {
  DcPromoPayoutRequestDto,
  DcPromoPayoutResponseDto,
} from '../../dtos/callback.dto';
import {
  GameAggregatorType,
  Prisma,
  BonusType,
} from '@repo/database';
import { CasinoBalanceService } from 'src/modules/casino/application/casino-balance.service';
import { CasinoBonusService } from 'src/modules/casino/application/casino-bonus.service';
import { DcMapperService } from '../../infrastructure/dc-mapper.service';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { parseDateStringOrThrow } from 'src/utils/date.util';

@Injectable()
export class PromoPayoutDcBetCallbackUseCase {
  private readonly logger = new Logger(PromoPayoutDcBetCallbackUseCase.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly casinoBalanceService: CasinoBalanceService,
    private readonly casinoBonusService: CasinoBonusService,
    private readonly dcMapperService: DcMapperService,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  /**
   * Promo Payout 콜백 (프로모션 지급)
   */
  @Transactional()
  async execute(
    body: DcPromoPayoutRequestDto,
  ): Promise<DcPromoPayoutResponseDto> {
    const {
      brand_uid,
      currency,
      amount,
      promotion_id,
      trans_id,
      provider,
      transaction_time,
    } = body;

    const gameCurrencyEnum =
      this.dcMapperService.convertDcsCurrencyToGamingCurrency(currency);
    const providerEnum = this.dcMapperService.fromDcsProvider(provider)!;
    const transactionTime = parseDateStringOrThrow(transaction_time);
    const bonusAmount = new Prisma.Decimal(amount);

    // 사용자 조회
    const user = await this.tx.user.findUnique({
      where: { dcsId: brand_uid },
      select: {
        id: true,
      },
    });

    if (!user) {
      this.logger.error(
        `❌ Promo Payout API - 사용자 존재하지 않음: ${brand_uid}`,
      );
      return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
    }

    try {
      // gameSession을 먼저 조회하여 exchangeRate 가져오기
      const gameSession = await this.tx.gameSession.findFirst({
        where: {
          userId: user.id,
          aggregatorType: GameAggregatorType.DCS,
          gameCurrency: gameCurrencyEnum,
        },
        select: {
          exchangeRate: true,
          walletCurrency: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const bonusResult = await this.casinoBonusService.processBonus({
        tx: this.tx,
        userId: user.id,
        gameCurrency: gameCurrencyEnum,
        transactionTime: transactionTime,
        aggregatorType: GameAggregatorType.DCS,
        provider: providerEnum,
        bonusType: BonusType.PROMOTION,
        bonusAmountInGameCurrency: bonusAmount,
        aggregatorPromotionId: promotion_id,
        aggregatorTransactionId: trans_id,
      });

      // gameSession이 있으면 exchangeRate를 곱해서 게임 통화로 변환
      // 없으면 월렛 통화 값 그대로 반환 (fallback)
      const balance = gameSession
        ? gameSession.exchangeRate.mul(
            bonusResult.afterMainBalance.add(bonusResult.afterBonusBalance),
          )
        : bonusResult.afterMainBalance.add(bonusResult.afterBonusBalance);

      // Audit 로그 기록 (성공)
      await this.dispatchLogService.dispatch({
        type: LogType.ACTIVITY,
        data: {
          userId: user.id.toString(),
          category: 'CASINO',
          action: 'PROMO_PAYOUT',
          metadata: {
            aggregatorType: GameAggregatorType.DCS,
            aggregatorPromotionId: promotion_id,
            aggregatorTransactionId: trans_id,
            provider: providerEnum,
            bonusAmount: amount.toString(),
            bonusAmountInWalletCurrency: gameSession
              ? bonusAmount.div(gameSession.exchangeRate).toString()
              : amount.toString(),
            currency,
            walletCurrency: gameSession?.walletCurrency || currency,
            beforeBalance: bonusResult.beforeMainBalance
              .add(bonusResult.beforeBonusBalance)
              .toString(),
            afterBalance: bonusResult.afterMainBalance
              .add(bonusResult.afterBonusBalance)
              .toString(),
            success: true,
          },
        },
      });

      return getDcsResponse(DcsResponseCode.SUCCESS, {
        balance,
        brand_uid,
        currency,
      });
    } catch (error) {
      this.logger.error(`❌ Promo Payout API 실패:`, error);

      // gameSession을 찾아서 실제 밸런스 조회
      let balance = new Prisma.Decimal(0);
      const gameSession = await this.tx.gameSession.findFirst({
        where: {
          userId: user.id,
          aggregatorType: GameAggregatorType.DCS,
          gameCurrency: gameCurrencyEnum,
        },
        select: {
          exchangeRate: true,
          walletCurrency: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (gameSession) {
        const userBalance =
          await this.casinoBalanceService.getUserCasinoBalance({
            userId: user.id,
            currency: gameSession.walletCurrency,
          });

        balance = gameSession.exchangeRate.mul(
          userBalance.mainBalance.add(userBalance.bonusBalance),
        );
      }

      // Audit 로그 기록 (실패)
      await this.dispatchLogService.dispatch({
        type: LogType.ACTIVITY,
        data: {
          userId: user.id.toString(),
          category: 'CASINO',
          action: 'PROMO_PAYOUT',
          metadata: {
            aggregatorType: GameAggregatorType.DCS,
            aggregatorPromotionId: promotion_id,
            aggregatorTransactionId: trans_id,
            provider: providerEnum,
            bonusAmount: amount.toString(),
            currency,
            walletCurrency: gameSession?.walletCurrency || currency,
            success: false,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          },
        },
      });

      const errorMessage = error instanceof Error ? error.message : String(error);
      switch (errorMessage) {
        case 'BONUS_ALREADY_PROCESSED':
          return getDcsResponse(DcsResponseCode.BET_RECORD_DUPLICATE, {
            balance,
            brand_uid,
            currency,
          });
        default:
          return getDcsResponse(DcsResponseCode.SYSTEM_ERROR);
      }
    }
  }
}

