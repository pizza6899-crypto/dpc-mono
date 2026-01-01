import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  DcsResponseCode,
  getDcsResponse,
} from 'src/modules/casino/dcs/constants/dcs-response-codes';
import {
  DcCancelWagerRequestDto,
  DcCancelWagerResponseDto,
} from '../../dtos/callback.dto';
import { GameAggregatorType, Prisma } from '@repo/database';
import { CasinoBalanceService } from 'src/modules/casino/application/casino-balance.service';
import { CasinoRefundService } from 'src/modules/casino/application/casino-refund.service';
import { DcMapperService } from '../../infrastructure/dc-mapper.service';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { parseDateStringOrThrow } from 'src/utils/date.util';
import { CasinoErrorCode } from 'src/modules/casino/constants/casino-error-codes';

@Injectable()
export class CancelWagerDcBetCallbackUseCase {
  private readonly logger = new Logger(CancelWagerDcBetCallbackUseCase.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly casinoBalanceService: CasinoBalanceService,
    private readonly casinoRefundService: CasinoRefundService,
    private readonly dcMapperService: DcMapperService,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  /**
   * Cancel Wager 콜백 (베팅 취소)
   */
  @Transactional()
  async execute(
    body: DcCancelWagerRequestDto,
  ): Promise<DcCancelWagerResponseDto> {
    const {
      brand_uid,
      currency,
      round_id,
      wager_id,
      provider,
      wager_type,
      is_endround,
      transaction_time,
    } = body;

    const gameCurrencyEnum =
      this.dcMapperService.convertDcsCurrencyToGamingCurrency(currency);

    // round_id로 gameRound를 조회하여 GameSession을 통해 사용자 정보 가져오기
    const gameRound = await this.tx.gameRound.findUnique({
      where: {
        aggregatorTxId_aggregatorType: {
          aggregatorTxId: round_id,
          aggregatorType: GameAggregatorType.DCS,
        },
      },
      select: {
        GameSession: {
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
        },
      },
    });

    try {
      if (!gameRound) {
        this.logger.error(
          `❌ Cancel Wager API - 게임 라운드 존재하지 않음: ${round_id}`,
        );

        // gameRound가 없어도 brand_uid로 사용자를 찾아서 audit 로그 기록
        const user = await this.tx.user.findUnique({
          where: { dcsId: brand_uid },
          select: { id: true },
        });

        if (user) {
          await this.dispatchLogService.dispatch({
            type: LogType.ACTIVITY,
            data: {
              userId: user.id.toString(),
              category: 'CASINO',
              action: 'CANCEL_WAGER',
              metadata: {
                aggregatorType: GameAggregatorType.DCS,
                aggregatorBetId: wager_id,
                aggregatorTxId: round_id,
                provider,
                wagerType:
                  wager_type === 1 ? 'CANCEL_WAGER' : 'CANCEL_END_WAGER',
                currency,
                isEndRound: is_endround,
                success: false,
                errorMessage: CasinoErrorCode.INVALID_TXN,
                errorType: 'InvalidTransaction',
              },
            },
          });
        }

        throw new Error(CasinoErrorCode.INVALID_TXN);
      }

      const gameSession = gameRound.GameSession;

      // brand_uid 검증 (보안을 위해)
      if (gameSession.user.dcsId !== brand_uid) {
        this.logger.error(
          `❌ Cancel Wager API - brand_uid 불일치: ${brand_uid}`,
        );
        throw new Error(CasinoErrorCode.INVALID_TXN);
      }

      // 1=cancelWager, 2=cancelEndWager
      const cancelTransactionResult =
        await this.casinoRefundService.processCancel({
          tx: this.tx,
          userId: gameSession.user.id,
          gameCurrency: gameCurrencyEnum,
          aggregatorTxId: round_id,
          aggregatorBetId: wager_id,
          aggregatorType: GameAggregatorType.DCS,
          cancelTime: parseDateStringOrThrow(transaction_time),
          isEndRound: is_endround,
        });

      const finalBalance = gameSession.exchangeRate.mul(
        cancelTransactionResult.afterMainBalance.add(
          cancelTransactionResult.afterBonusBalance,
        ),
      );

      // Audit 로그 기록 (성공)
      await this.dispatchLogService.dispatch({
        type: LogType.ACTIVITY,
        data: {
          userId: gameSession.user.id.toString(),
          category: 'CASINO',
          action: 'CANCEL_WAGER',
          metadata: {
            aggregatorType: GameAggregatorType.DCS,
            aggregatorBetId: wager_id,
            aggregatorTxId: round_id,
            gameId: gameSession.game!.id.toString(),
            provider,
            wagerType: wager_type === 1 ? 'CANCEL_WAGER' : 'CANCEL_END_WAGER',
            currency,
            walletCurrency: gameSession.walletCurrency,
            isEndRound: is_endround,
            beforeBalance: cancelTransactionResult.beforeMainBalance
              .add(cancelTransactionResult.beforeBonusBalance)
              .toString(),
            afterBalance: cancelTransactionResult.afterMainBalance
              .add(cancelTransactionResult.afterBonusBalance)
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
      this.logger.error(error, `Cancel Wager 콜백 실패`);

      // gameSession이 이미 있으므로 이를 활용하여 실제 밸런스 조회
      let balance = new Prisma.Decimal(0);
      const gameSession = gameRound?.GameSession;

      if (gameSession) {
        const userBalance =
          await this.casinoBalanceService.getUserCasinoBalance({
            userId: gameSession.user.id,
            currency: gameSession.walletCurrency,
          });

        balance = gameSession.exchangeRate.mul(
          userBalance.mainBalance.add(userBalance.bonusBalance),
        );
      }

      // Audit 로그 기록 (실패)
      if (gameSession) {
        await this.dispatchLogService.dispatch({
          type: LogType.ACTIVITY,
          data: {
            userId: gameSession.user.id.toString(),
            category: 'CASINO',
            action: 'CANCEL_WAGER',
            metadata: {
              aggregatorType: GameAggregatorType.DCS,
              aggregatorBetId: wager_id,
              aggregatorTxId: round_id,
              provider,
              wagerType:
                wager_type === 1 ? 'CANCEL_WAGER' : 'CANCEL_END_WAGER',
              currency,
              walletCurrency: gameSession.walletCurrency,
              isEndRound: is_endround,
              success: false,
              errorMessage: error instanceof Error ? error.message : String(error),
              errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            },
          },
        });
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      switch (errorMessage) {
        case CasinoErrorCode.INVALID_TXN:
          return getDcsResponse(DcsResponseCode.BET_RECORD_NOT_EXIST, {
            balance,
            brand_uid,
            currency,
          });
        case CasinoErrorCode.BET_ALREADY_CANCELLED:
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

