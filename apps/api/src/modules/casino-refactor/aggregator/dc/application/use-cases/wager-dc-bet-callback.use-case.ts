import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  DcsResponseCode,
  getDcsResponse,
} from 'src/modules/casino/dcs/constants/dcs-response-codes';
import {
  DcWagerRequestDto,
  DcWagerResponseDto,
} from '../../dtos/callback.dto';
import { GameAggregatorType, BetType, Prisma } from '@repo/database';
import { CasinoBalanceService } from 'src/modules/casino/application/casino-balance.service';
import { CasinoBetService } from 'src/modules/casino/application/casino-bet.service';
import { DcMapperService } from '../../infrastructure/dc-mapper.service';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import {
  PlayerNotFoundException,
  NotLoggedInException,
  IncorrectProviderException,
  IncorrectAmountException,
  BalanceInsufficientException,
  BetRecordDuplicateException,
  DcCallbackException,
} from '../../domain';

@Injectable()
export class WagerDcBetCallbackUseCase {
  private readonly logger = new Logger(WagerDcBetCallbackUseCase.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly casinoBalanceService: CasinoBalanceService,
    private readonly casinoBetService: CasinoBetService,
    private readonly dcMapperService: DcMapperService,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  /**
   * Wager 콜백 (베팅)
   */
  @Transactional()
  async execute(body: DcWagerRequestDto): Promise<DcWagerResponseDto> {
    const {
      brand_uid,
      currency,
      amount,
      jackpot_contribution,
      game_id,
      game_name,
      round_id,
      wager_id,
      provider,
      bet_type,
      transaction_time,
      is_endround,
      token,
    } = body;

    // 금액 검증
    if (!amount || amount <= 0) {
      throw new IncorrectAmountException(amount);
    }

    const gameCurrencyEnum =
      this.dcMapperService.convertDcsCurrencyToGamingCurrency(currency);
    const providerEnum = this.dcMapperService.fromDcsProvider(provider);
    if (!providerEnum) {
      throw new IncorrectProviderException(provider);
    }

    const jackpotContributionAmount = new Prisma.Decimal(
      jackpot_contribution ?? 0,
    );

    const gameSession = await this.tx.gameSession.findFirst({
      where: {
        aggregatorType: GameAggregatorType.DCS,
        token,
      },
      select: {
        id: true,
        exchangeRate: true,
        walletCurrency: true,
        user: {
          select: {
            id: true,
            dcsId: true,
          },
        },
        game: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!gameSession) {
      this.logger.error(`❌ Wager API - 게임 세션 존재하지 않음: ${brand_uid}`);
      throw new PlayerNotFoundException(brand_uid);
    }

    // token 불일치
    // 토큰이 다른 유저꺼임
    if (gameSession.user.dcsId !== brand_uid) {
      this.logger.error(`❌ Wager API - 토큰 불일치: ${brand_uid}`);
      throw new NotLoggedInException(brand_uid);
    }

    try {
      const betTransactionResult = await this.casinoBetService.processBet({
        tx: this.tx,
        userId: gameSession.user.id,
        betAmountInGameCurrency: new Prisma.Decimal(amount),
        betAmountInWalletCurrency: new Prisma.Decimal(amount).div(
          gameSession.exchangeRate,
        ),
        walletCurrency: gameSession.walletCurrency,
        gameSessionId: gameSession.id,
        aggregatorTxId: round_id,
        aggregatorBetId: wager_id,
        aggregatorType: GameAggregatorType.DCS,
        aggregatorGameId: game_id,
        provider: providerEnum,
        gameId: gameSession.game!.id,
        betTime: transaction_time,
        jackpotContributionAmount,
        betType: bet_type === 1 ? BetType.NORMAL : BetType.TIP,
      });

      const finalBalance = gameSession.exchangeRate.mul(
        betTransactionResult.afterMainBalance.add(
          betTransactionResult.afterBonusBalance,
        ),
      );

      // Audit 로그 기록 (성공)
      await this.dispatchLogService.dispatch({
        type: LogType.ACTIVITY,
        data: {
          userId: gameSession.user.id.toString(),
          category: 'CASINO',
          action: 'WAGER',
          metadata: {
            aggregatorType: GameAggregatorType.DCS,
            aggregatorBetId: wager_id,
            aggregatorTxId: round_id,
            gameId: gameSession.game!.id.toString(),
            provider: providerEnum,
            betAmount: amount.toString(),
            betAmountInWalletCurrency: new Prisma.Decimal(amount)
              .div(gameSession.exchangeRate)
              .toString(),
            currency,
            walletCurrency: gameSession.walletCurrency,
            betType: bet_type === 1 ? 'NORMAL' : 'TIP',
            jackpotContribution: jackpot_contribution?.toString() || '0',
            isEndRound: is_endround,
            beforeBalance: betTransactionResult.beforeMainBalance
              .add(betTransactionResult.beforeBonusBalance)
              .toString(),
            afterBalance: betTransactionResult.afterMainBalance
              .add(betTransactionResult.afterBonusBalance)
              .toString(),
            success: true,
          },
        },
      });

      return getDcsResponse(DcsResponseCode.SUCCESS, {
        balance: finalBalance,
        brand_uid,
        currency,
      });
    } catch (error) {
      this.logger.error(error, `Wager 콜백 실패`);

      // 도메인 예외인 경우 바로 변환
      if (error instanceof DcCallbackException) {
        const userBalance =
          await this.casinoBalanceService.getUserCasinoBalance({
            userId: gameSession.user.id,
            currency: gameSession.walletCurrency,
          });

        const balance = gameSession.exchangeRate.mul(
          userBalance.mainBalance.add(userBalance.bonusBalance),
        );

        // Audit 로그 기록 (실패)
        await this.dispatchLogService.dispatch({
          type: LogType.ACTIVITY,
          data: {
            userId: gameSession.user.id.toString(),
            category: 'CASINO',
            action: 'WAGER',
            metadata: {
              aggregatorType: GameAggregatorType.DCS,
              aggregatorBetId: wager_id,
              aggregatorTxId: round_id,
              gameId: gameSession.game!.id.toString(),
              provider: providerEnum,
              betAmount: amount.toString(),
              currency,
              walletCurrency: gameSession.walletCurrency,
              betType: bet_type === 1 ? 'NORMAL' : 'TIP',
              isEndRound: is_endround,
              success: false,
              errorMessage: error.message,
              errorType: error.constructor.name,
            },
          },
        });

        // 도메인 예외의 responseCode를 사용하여 응답 생성
        return getDcsResponse(
          error.responseCode,
          error instanceof BalanceInsufficientException ||
            error instanceof BetRecordDuplicateException
            ? {
                brand_uid,
                currency,
                balance,
              }
            : {
                brand_uid,
                currency,
              },
        );
      }

      // 기존 에러 처리 (하위 호환성)
      const userBalance = await this.casinoBalanceService.getUserCasinoBalance({
        userId: gameSession.user.id,
        currency: gameSession.walletCurrency,
      });

      const balance = gameSession.exchangeRate.mul(
        userBalance.mainBalance.add(userBalance.bonusBalance),
      );

      // Audit 로그 기록 (실패)
      await this.dispatchLogService.dispatch({
        type: LogType.ACTIVITY,
        data: {
          userId: gameSession.user.id.toString(),
          category: 'CASINO',
          action: 'WAGER',
          metadata: {
            aggregatorType: GameAggregatorType.DCS,
            aggregatorBetId: wager_id,
            aggregatorTxId: round_id,
            gameId: gameSession.game!.id.toString(),
            provider: providerEnum,
            betAmount: amount.toString(),
            currency,
            walletCurrency: gameSession.walletCurrency,
            betType: bet_type === 1 ? 'NORMAL' : 'TIP',
            isEndRound: is_endround,
            success: false,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          },
        },
      });

      // 기존 에러 메시지 기반 매핑
      switch (error.message) {
        case 'INSUFFICIENT_FUNDS':
          return getDcsResponse(DcsResponseCode.BALANCE_INSUFFICIENT, {
            brand_uid,
            currency,
            balance,
          });
        case 'DUPLICATE_DEBIT':
          return getDcsResponse(DcsResponseCode.BET_RECORD_DUPLICATE, {
            brand_uid,
            currency,
            balance,
          });
        case 'USER_BALANCE_NOT_FOUND':
          return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
        default:
          return getDcsResponse(DcsResponseCode.SYSTEM_ERROR);
      }
    }
  }
}

