import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  DcsResponseCode,
  getDcsResponse,
} from 'src/modules/casino/dcs/constants/dcs-response-codes';
import {
  DcAppendWagerRequestDto,
  DcAppendWagerResponseDto,
} from '../../dtos/callback.dto';
import { GameAggregatorType, Prisma } from '@repo/database';
import { CasinoBalanceService } from 'src/modules/casino/application/casino-balance.service';
import { CasinoBetService } from 'src/modules/casino/application/casino-bet.service';
import { DcMapperService } from '../../infrastructure/dc-mapper.service';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { parseDateStringOrThrow } from 'src/utils/date.util';
import { CasinoErrorCode } from 'src/modules/casino/constants/casino-error-codes';

@Injectable()
export class AppendWagerDcBetCallbackUseCase {
  private readonly logger = new Logger(AppendWagerDcBetCallbackUseCase.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly casinoBalanceService: CasinoBalanceService,
    private readonly casinoBetService: CasinoBetService,
    private readonly dcMapperService: DcMapperService,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  /**
   * Append Wager 콜백 (추가 베팅 - 잭팟 당첨)
   */
  @Transactional()
  async execute(
    body: DcAppendWagerRequestDto,
  ): Promise<DcAppendWagerResponseDto> {
    const {
      brand_uid,
      currency,
      amount,
      game_id,
      round_id,
      wager_id,
      provider,
      description,
      is_endround,
      transaction_time,
    } = body;

    const gameCurrencyEnum =
      this.dcMapperService.convertDcsCurrencyToGamingCurrency(currency);
    const providerEnum = this.dcMapperService.fromDcsProvider(provider)!;

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
          },
        },
        game: {
          select: {
            id: true,
            aggregatorGameId: true,
          },
        },
      },
    });

    try {
      if (!gameRound) {
        this.logger.error(
          `❌ Append Wager API - 게임 라운드 존재하지 않음: ${round_id}`,
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
              action: 'APPEND_WAGER',
              metadata: {
                aggregatorType: GameAggregatorType.DCS,
                aggregatorWagerId: wager_id,
                aggregatorTxId: round_id,
                provider: providerEnum,
                winAmount: amount.toString(),
                currency,
                description,
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
          `❌ Append Wager API - brand_uid 불일치: ${brand_uid}`,
        );
        
        // brand_uid 불일치 시 audit 로그 기록
        await this.dispatchLogService.dispatch({
          type: LogType.ACTIVITY,
          data: {
            userId: gameSession.user.id.toString(),
            category: 'CASINO',
            action: 'APPEND_WAGER',
            metadata: {
              aggregatorType: GameAggregatorType.DCS,
              aggregatorWagerId: wager_id,
              aggregatorTxId: round_id,
              provider: providerEnum,
              winAmount: amount.toString(),
              currency,
              walletCurrency: gameSession.walletCurrency,
              description,
              isEndRound: is_endround,
              success: false,
              errorMessage: CasinoErrorCode.INVALID_TXN,
              errorType: 'InvalidTransaction',
            },
          },
        });
        
        throw new Error(CasinoErrorCode.INVALID_TXN);
      }

      // 게임 ID 검증
      if (!gameRound.game || gameRound.game.aggregatorGameId !== game_id) {
        this.logger.error(
          `❌ Append Wager API - 게임 ID 불일치: ${game_id}`,
        );
        
        // 게임 ID 불일치 시 audit 로그 기록
        await this.dispatchLogService.dispatch({
          type: LogType.ACTIVITY,
          data: {
            userId: gameSession.user.id.toString(),
            category: 'CASINO',
            action: 'APPEND_WAGER',
            metadata: {
              aggregatorType: GameAggregatorType.DCS,
              aggregatorWagerId: wager_id,
              aggregatorTxId: round_id,
              gameId: gameRound.game?.id.toString() || 'unknown',
              provider: providerEnum,
              winAmount: amount.toString(),
              currency,
              walletCurrency: gameSession.walletCurrency,
              description,
              isEndRound: is_endround,
              success: false,
              errorMessage: CasinoErrorCode.INVALID_TXN,
              errorType: 'InvalidTransaction',
            },
          },
        });
        
        throw new Error(CasinoErrorCode.INVALID_TXN);
      }

      const appendWagerResult = await this.casinoBetService.processAppendWager({
        tx: this.tx,
        userId: gameSession.user.id,
        winAmountInGameCurrency: new Prisma.Decimal(amount),
        winTime: parseDateStringOrThrow(transaction_time),
        currency: gameCurrencyEnum,
        aggregatorType: GameAggregatorType.DCS,
        aggregatorWagerId: wager_id,
        aggregatorTxId: round_id,
        isEndRound: is_endround,
        description: description,
      });

      const finalBalance = gameSession.exchangeRate.mul(
        appendWagerResult.afterMainBalance.add(
          appendWagerResult.afterBonusBalance,
        ),
      );

      // Audit 로그 기록 (성공)
      await this.dispatchLogService.dispatch({
        type: LogType.ACTIVITY,
        data: {
          userId: gameSession.user.id.toString(),
          category: 'CASINO',
          action: 'APPEND_WAGER',
          metadata: {
            aggregatorType: GameAggregatorType.DCS,
            aggregatorWagerId: wager_id,
            aggregatorTxId: round_id,
            gameId: gameRound.game!.id.toString(),
            provider: providerEnum,
            winAmount: amount.toString(),
            winAmountInWalletCurrency: new Prisma.Decimal(amount)
              .div(gameSession.exchangeRate)
              .toString(),
            currency,
            walletCurrency: gameSession.walletCurrency,
            description,
            isEndRound: is_endround,
            beforeBalance: appendWagerResult.beforeMainBalance
              .add(appendWagerResult.beforeBonusBalance)
              .toString(),
            afterBalance: appendWagerResult.afterMainBalance
              .add(appendWagerResult.afterBonusBalance)
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
      this.logger.error(error, `Append Wager 콜백 실패`);

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
            action: 'APPEND_WAGER',
            metadata: {
              aggregatorType: GameAggregatorType.DCS,
              aggregatorWagerId: wager_id,
              aggregatorTxId: round_id,
              provider: providerEnum,
              winAmount: amount.toString(),
              currency,
              walletCurrency: gameSession.walletCurrency,
              description,
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

