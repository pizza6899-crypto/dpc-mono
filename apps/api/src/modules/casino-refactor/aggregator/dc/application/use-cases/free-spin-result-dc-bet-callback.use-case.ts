import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  DcsResponseCode,
  getDcsResponse,
} from 'src/modules/casino/dcs/constants/dcs-response-codes';
import {
  DcFreeSpinResultRequestDto,
  DcFreeSpinResultResponseDto,
} from '../../dtos/callback.dto';
import {
  GameAggregatorType,
  Prisma,
  BonusType,
  TransactionStatus,
} from '@repo/database';
import { CasinoBalanceService } from 'src/modules/casino/application/casino-balance.service';
import { CasinoBonusService } from 'src/modules/casino/application/casino-bonus.service';
import { DcMapperService } from '../../infrastructure/dc-mapper.service';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { parseDateStringOrThrow } from 'src/utils/date.util';
import { CasinoErrorCode } from 'src/modules/casino/constants/casino-error-codes';

@Injectable()
export class FreeSpinResultDcBetCallbackUseCase {
  private readonly logger = new Logger(FreeSpinResultDcBetCallbackUseCase.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly casinoBalanceService: CasinoBalanceService,
    private readonly casinoBonusService: CasinoBonusService,
    private readonly dcMapperService: DcMapperService,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  /**
   * Free Spin Result 콜백 (무료 스핀 결과)
   */
  @Transactional()
  async execute(
    body: DcFreeSpinResultRequestDto,
  ): Promise<DcFreeSpinResultResponseDto> {
    const {
      brand_uid,
      currency,
      amount,
      game_id,
      game_name,
      round_id,
      wager_id,
      provider,
      is_endround,
      freespin_id,
      freespin_description,
      transaction_time,
    } = body;

    const gameCurrencyEnum =
      this.dcMapperService.convertDcsCurrencyToGamingCurrency(currency);
    const providerEnum = this.dcMapperService.fromDcsProvider(provider)!;
    const isEndRound = is_endround === true;

    // 1. 사용자 조회
    const user = await this.tx.user.findUnique({
      where: { dcsId: brand_uid },
      select: {
        id: true,
      },
    });

    if (!user) {
      this.logger.error(
        `❌ Free Spin Result API - 사용자 존재하지 않음: ${brand_uid}`,
      );
      return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
    }

    // 2. 게임 조회
    const game = await this.tx.game.findFirst({
      where: {
        aggregatorType: GameAggregatorType.DCS,
        provider: providerEnum,
        aggregatorGameId: game_id,
      },
      select: {
        id: true,
        aggregatorGameId: true,
      },
    });

    if (!game) {
      this.logger.error(
        `❌ Free Spin Result API - 게임 존재하지 않음: ${game_id}`,
      );
      return getDcsResponse(DcsResponseCode.GAME_ID_NOT_EXIST);
    }

    // 3. 게임 세션 찾기 (최근 세션)
    const gameSession = await this.tx.gameSession.findFirst({
      where: {
        userId: user.id,
        aggregatorType: GameAggregatorType.DCS,
        gameCurrency: gameCurrencyEnum,
        gameId: game.id,
      },
      orderBy: {
        createdAt: 'desc',
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
      },
    });

    if (!gameSession) {
      this.logger.error(
        `❌ Free Spin Result API - 게임 세션 존재하지 않음: ${brand_uid}`,
      );
      return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
    }

    // brand_uid 검증 (보안을 위해)
    if (gameSession.user.dcsId !== brand_uid) {
      this.logger.error(
        `❌ Free Spin Result API - brand_uid 불일치: ${brand_uid}`,
      );
      return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
    }

    try {
      const bonusResult = await this.casinoBonusService.processBonus({
        tx: this.tx,
        userId: gameSession.user.id,
        gameCurrency: gameCurrencyEnum,
        transactionTime: parseDateStringOrThrow(transaction_time),
        aggregatorType: GameAggregatorType.DCS,
        provider: providerEnum,
        bonusType: BonusType.IN_GAME_BONUS,
        bonusAmountInGameCurrency: new Prisma.Decimal(amount),
        aggregatorFreespinId: freespin_id?.toString(),
        aggregatorRoundId: round_id,
        aggregatorWagerId: wager_id,
        isEndRound: isEndRound,
        gameId: game.id,
        gameSessionId: gameSession.id,
        description: freespin_description,
      });

      const finalBalance = gameSession.exchangeRate.mul(
        bonusResult.afterMainBalance.add(bonusResult.afterBonusBalance),
      );

      // isEndRound일 때 게임 라운드 완료 처리
      if (isEndRound) {
        const gameRound = await this.tx.gameRound.findUnique({
          where: {
            aggregatorTxId_aggregatorType: {
              aggregatorTxId: round_id,
              aggregatorType: GameAggregatorType.DCS,
            },
          },
          select: {
            id: true,
          },
        });

        if (gameRound) {
          await this.tx.gameRound.update({
            where: {
              aggregatorTxId_aggregatorType: {
                aggregatorTxId: round_id,
                aggregatorType: GameAggregatorType.DCS,
              },
            },
            data: {
              completedAt: parseDateStringOrThrow(transaction_time),
              transaction: {
                update: {
                  status: TransactionStatus.COMPLETED,
                },
              },
            },
          });
        }
      }

      // Audit 로그 기록 (성공)
      await this.dispatchLogService.dispatch({
        type: LogType.ACTIVITY,
        data: {
          userId: gameSession.user.id.toString(),
          category: 'CASINO',
          action: 'FREE_SPIN_RESULT',
          metadata: {
            aggregatorType: GameAggregatorType.DCS,
            aggregatorWagerId: wager_id,
            aggregatorTxId: round_id,
            aggregatorFreespinId: freespin_id?.toString(),
            gameId: game.id.toString(),
            provider: providerEnum,
            bonusAmount: amount.toString(),
            bonusAmountInWalletCurrency: new Prisma.Decimal(amount)
              .div(gameSession.exchangeRate)
              .toString(),
            currency,
            walletCurrency: gameSession.walletCurrency,
            description: freespin_description,
            isEndRound: is_endround,
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
        balance: finalBalance,
        brand_uid,
        currency,
      });
    } catch (error) {
      this.logger.error(error, `Free Spin Result 콜백 실패`);

      // gameSession이 이미 있으므로 이를 활용하여 실제 밸런스 조회
      let balance = new Prisma.Decimal(0);

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
            action: 'FREE_SPIN_RESULT',
            metadata: {
              aggregatorType: GameAggregatorType.DCS,
              aggregatorWagerId: wager_id,
              aggregatorTxId: round_id,
              aggregatorFreespinId: freespin_id?.toString(),
              gameId: game.id.toString(),
              provider: providerEnum,
              bonusAmount: amount.toString(),
              currency,
              walletCurrency: gameSession.walletCurrency,
              description: freespin_description,
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

