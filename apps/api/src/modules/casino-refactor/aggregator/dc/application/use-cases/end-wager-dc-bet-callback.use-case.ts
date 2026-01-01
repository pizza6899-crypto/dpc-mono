import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  DcsResponseCode,
  getDcsResponse,
} from 'src/modules/casino/dcs/constants/dcs-response-codes';
import {
  DcEndWagerRequestDto,
  DcEndWagerResponseDto,
} from '../../dtos/callback.dto';
import { GameAggregatorType, Prisma } from '@repo/database';
import { CasinoBalanceService } from 'src/modules/casino/application/casino-balance.service';
import { CasinoBetService } from 'src/modules/casino/application/casino-bet.service';
import { DcMapperService } from '../../infrastructure/dc-mapper.service';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { CasinoErrorCode } from 'src/modules/casino/constants/casino-error-codes';

@Injectable()
export class EndWagerDcBetCallbackUseCase {
  private readonly logger = new Logger(EndWagerDcBetCallbackUseCase.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly casinoBalanceService: CasinoBalanceService,
    private readonly casinoBetService: CasinoBetService,
    private readonly dcMapperService: DcMapperService,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  /**
   * End Wager 콜백 (베팅 종료 및 지급)
   */
  @Transactional()
  async execute(
    body: DcEndWagerRequestDto,
  ): Promise<DcEndWagerResponseDto> {
    const {
      brand_uid,
      currency,
      amount,
      round_id,
      wager_id,
      provider,
      is_endround,
      transaction_time,
    } = body;

    const gameCurrencyEnum =
      this.dcMapperService.convertDcsCurrencyToGamingCurrency(currency);
    const isEndRound = is_endround === true;

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
      // gameRound가 없으면 (아직 베팅이 안 된 경우) 에러 처리
      if (!gameRound) {
        this.logger.error(
          `❌ End Wager API - 게임 라운드 존재하지 않음: ${round_id}`,
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
              action: 'END_WAGER',
              metadata: {
                aggregatorType: GameAggregatorType.DCS,
                aggregatorWinId: wager_id,
                aggregatorTxId: round_id,
                provider,
                winAmount: amount.toString(),
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
          `❌ End Wager API - brand_uid 불일치: ${brand_uid}`,
        );

        // brand_uid 불일치 시 audit 로그 기록
        await this.dispatchLogService.dispatch({
          type: LogType.ACTIVITY,
          data: {
            userId: gameSession.user.id.toString(),
            category: 'CASINO',
            action: 'END_WAGER',
            metadata: {
              aggregatorType: GameAggregatorType.DCS,
              aggregatorWinId: wager_id,
              aggregatorTxId: round_id,
              provider,
              winAmount: amount.toString(),
              currency,
              walletCurrency: gameSession.walletCurrency,
              isEndRound: is_endround,
              success: false,
              errorMessage: CasinoErrorCode.INVALID_TXN,
              errorType: 'InvalidTransaction',
            },
          },
        });

        throw new Error(CasinoErrorCode.INVALID_TXN);
      }

      const winTransactionResult = await this.casinoBetService.processWin({
        tx: this.tx,
        userId: gameSession.user.id,
        gameCurrency: gameCurrencyEnum,
        walletCurrency: gameSession.walletCurrency,
        winAmountInWalletCurrency: new Prisma.Decimal(amount).div(
          gameSession.exchangeRate,
        ),
        aggregatorType: GameAggregatorType.DCS,
        winAmountInGameCurrency: new Prisma.Decimal(amount),
        winTime: transaction_time,
        aggregatorTxId: round_id,
        aggregatorWinId: wager_id,
        isEndRound: isEndRound,
      });

      const finalBalance = gameSession.exchangeRate.mul(
        winTransactionResult.afterMainBalance.add(
          winTransactionResult.afterBonusBalance,
        ),
      );

      // Audit 로그 기록 (성공)
      await this.dispatchLogService.dispatch({
        type: LogType.ACTIVITY,
        data: {
          userId: gameSession.user.id.toString(),
          category: 'CASINO',
          action: 'END_WAGER',
          metadata: {
            aggregatorType: GameAggregatorType.DCS,
            aggregatorWinId: wager_id,
            aggregatorTxId: round_id,
            gameId: gameSession.game!.id.toString(),
            provider,
            winAmount: amount.toString(),
            winAmountInWalletCurrency: new Prisma.Decimal(amount)
              .div(gameSession.exchangeRate)
              .toString(),
            currency,
            walletCurrency: gameSession.walletCurrency,
            isEndRound: is_endround,
            beforeBalance: winTransactionResult.beforeMainBalance
              .add(winTransactionResult.beforeBonusBalance)
              .toString(),
            afterBalance: winTransactionResult.afterMainBalance
              .add(winTransactionResult.afterBonusBalance)
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
      this.logger.error(error, `End Wager 콜백 실패`);

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
      } else {
        // gameRound가 없는 경우 (INVALID_TXN 등)
        // brand_uid로 사용자를 찾아서 밸런스를 가져옴
        const user = await this.tx.user.findUnique({
          where: { dcsId: brand_uid },
          select: {
            id: true,
          },
        });

        if (user) {
          // GameSession을 조회해서 exchangeRate와 walletCurrency를 가져올 수 있음
          const foundGameSession = await this.tx.gameSession.findFirst({
            where: {
              aggregatorType: GameAggregatorType.DCS,
              user: {
                dcsId: brand_uid,
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              exchangeRate: true,
              walletCurrency: true,
            },
          });

          if (foundGameSession) {
            const userBalance =
              await this.casinoBalanceService.getUserCasinoBalance({
                userId: user.id,
                currency: foundGameSession.walletCurrency,
              });

            balance = foundGameSession.exchangeRate.mul(
              userBalance.mainBalance.add(userBalance.bonusBalance),
            );
          }

          // Audit 로그 기록 (실패 - gameSession이 없는 경우)
          await this.dispatchLogService.dispatch({
            type: LogType.ACTIVITY,
            data: {
              userId: user.id.toString(),
              category: 'CASINO',
              action: 'END_WAGER',
              metadata: {
                aggregatorType: GameAggregatorType.DCS,
                aggregatorWinId: wager_id,
                aggregatorTxId: round_id,
                provider,
                winAmount: amount.toString(),
                currency,
                walletCurrency: foundGameSession?.walletCurrency || currency,
                isEndRound: is_endround,
                success: false,
                errorMessage: error instanceof Error ? error.message : String(error),
                errorType: error instanceof Error ? error.constructor.name : 'Unknown',
              },
            },
          });
        }
      }

      // Audit 로그 기록 (실패 - gameSession이 있는 경우)
      if (gameSession) {
        await this.dispatchLogService.dispatch({
          type: LogType.ACTIVITY,
          data: {
            userId: gameSession.user.id.toString(),
            category: 'CASINO',
            action: 'END_WAGER',
            metadata: {
              aggregatorType: GameAggregatorType.DCS,
              aggregatorWinId: wager_id,
              aggregatorTxId: round_id,
              provider,
              winAmount: amount.toString(),
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
        case CasinoErrorCode.DUPLICATE_CREDIT:
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

