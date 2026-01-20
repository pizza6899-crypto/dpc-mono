import { Injectable, Logger } from '@nestjs/common';
import { EnvService } from 'src/common/env/env.service';
import {
  BetType,
  BonusType,
  GameAggregatorType,
  GameProvider,
  Prisma,
  TransactionStatus,
} from '@repo/database';
import { WhitecliffMapperService } from '../infrastructure/whitecliff-mapper.service';
import { GetUserBalanceService } from 'src/modules/wallet/application/get-user-balance.service';
import { CasinoBetService } from '../../../application/casino-bet.service';
import { CasinoBonusService } from '../../../application/casino-bonus.service';
import { getCasinoErrorCode } from '../utils/whitecliff-error-response.util';
import { CasinoErrorCode } from '../../../constants/casino-error-codes';
import { CasinoQueueService } from '../../../infrastructure/queue/casino-queue.service';
import { CasinoRefundService } from '../../../application/casino-refund.service';
import { nowUtc, parseDateStringOrThrow } from 'src/utils/date.util';
import { InjectTransaction, Transactional } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { GAMING_CURRENCIES, type GamingCurrencyCode } from 'src/utils/currency.util';
import { CreditRequestDto, DebitRequestDto, GetBonusRequestDto, GetBonusResponseDto, GetWhitecliffBalanceRequestDto, GetWhitecliffBalanceResponseDto, TransactionResponseDto } from '../dtos';

@Injectable()
export class WhitecliffCallbackService {
  private readonly logger = new Logger(WhitecliffCallbackService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly envService: EnvService,
    private readonly whitecliffMapperService: WhitecliffMapperService,
    private readonly getUserBalanceService: GetUserBalanceService,
    private readonly casinoBetService: CasinoBetService,
    private readonly casinoBonusService: CasinoBonusService,
    private readonly queueService: CasinoQueueService,
    private readonly casinoRefundService: CasinoRefundService,
  ) { }

  /**
   * 사용자 잔액 조회
   * @param userId 사용자 ID
   * @param prdId 제품 ID
   * @param sid 세션 ID
   * @returns 사용자 잔액 정보
   */
  async getBalance(
    body: GetWhitecliffBalanceRequestDto,
    currency?: GamingCurrencyCode,
  ): Promise<GetWhitecliffBalanceResponseDto> {
    const { user_id, prd_id, sid } = body;

    try {
      const gameSession = await this.tx.casinoGameSession.findFirst({
        where: {
          aggregatorType: GameAggregatorType.WHITECLIFF,
          token: sid, // sid로 직접 찾기
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          exchangeRate: true,
          walletCurrency: true,
          gameCurrency: true,
          user: {
            select: {
              id: true,
              whitecliffSystemId: true,
            },
          },
        },
      });

      if (!gameSession) {
        this.logger.error(
          `❌ Balance API - 게임 세션 존재하지 않음: sid=${sid}, user_id=${user_id}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      // user_id 검증 (보안을 위해 - DCS의 brand_uid 검증과 동일)
      if (
        gameSession.user.whitecliffSystemId &&
        Number(gameSession.user.whitecliffSystemId) !== Number(user_id)
      ) {
        this.logger.error(
          `❌ Balance API - user_id 불일치: session_user_id=${gameSession.user.whitecliffSystemId}, request_user_id=${user_id}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      // 4. gameCurrency 검증
      if (currency && gameSession.gameCurrency !== currency) {
        this.logger.error(
          `❌ Balance API - gameCurrency 불일치: session_currency=${gameSession.gameCurrency}, request_currency=${currency}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      const balanceResult = await this.getUserBalanceService.execute({
        userId: gameSession.user.id,
        currency: gameSession.walletCurrency,
      });

      const userWallet = Array.isArray(balanceResult.wallet) ? balanceResult.wallet[0] : balanceResult.wallet;

      if (!userWallet) {
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      const balance = gameSession.exchangeRate.mul(
        userWallet.totalBalance,
      );

      return {
        status: 1,
        balance: balance.toNumber(),
      };
    } catch (error) {
      this.logger.error(error, `잔액 조회 실패`);
      const errorMessage = getCasinoErrorCode(error);
      return {
        status: 0,
        balance: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * 사용자 잔액 차감
   * @param userId 사용자 ID
   * @param amount 차감할 금액
   * @returns 거래 결과
   */
  @Transactional()
  async debit(
    body: DebitRequestDto,
    currency?: GamingCurrencyCode,
  ): Promise<TransactionResponseDto> {
    const {
      user_id,
      amount,
      prd_id,
      txn_id,
      round_id,
      game_id,
      table_id,
      credit_amount,
      debit_time,
      sid,
      odds,
      is_parlay,
      desc,
    } = body;

    try {
      this.validateRequiredFields(body, ['user_id', 'amount', 'txn_id', 'round_id']);

      const provider =
        this.whitecliffMapperService.fromWhitecliffProvider(prd_id);

      if (!provider) {
        this.logger.error(`❌ Debit API - 잘못된 Provider ID: ${prd_id}`);
        throw new Error(CasinoErrorCode.INVALID_PRODUCT);
      }

      const gameSession = await this.tx.casinoGameSession.findFirst({
        where: {
          aggregatorType: GameAggregatorType.WHITECLIFF,
          token: sid,
        },
        select: {
          id: true,
          exchangeRate: true,
          walletCurrency: true,
          gameCurrency: true,
          user: {
            select: {
              id: true,
              whitecliffSystemId: true,
            },
          },
          casinoGameV2: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!gameSession) {
        this.logger.error(
          `❌ Debit API - 게임 세션 존재하지 않음: sid=${sid}, user_id=${user_id}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      // 3. user_id 검증
      if (
        gameSession.user.whitecliffSystemId &&
        Number(gameSession.user.whitecliffSystemId) !== Number(user_id)
      ) {
        this.logger.error(
          `❌ Debit API - user_id 불일치: session_user_id=${gameSession.user.whitecliffSystemId}, request_user_id=${user_id}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      // 4. gameCurrency 검증
      if (currency && gameSession.gameCurrency !== currency) {
        this.logger.error(
          `❌ Debit API - gameCurrency 불일치: session_currency=${gameSession.gameCurrency}, request_currency=${currency}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      // 5. game 조회 (gameSession에 없으면 별도 조회)
      let gameId = gameSession.casinoGameV2?.id;
      if (!gameId) {
        const game = await this.tx.casinoGameV2.findFirst({
          where: {
            provider: {
              code: provider,
            },
            externalGameId: String(game_id),
          },
          select: {
            id: true,
          },
        });

        if (!game) {
          this.logger.error(`❌ Debit API - 게임 존재하지 않음: ${game_id}`);
          throw new Error(CasinoErrorCode.INVALID_PRODUCT);
        }
        gameId = game.id;
      }

      const walletCurrency = gameSession.walletCurrency;
      const betAmountInWalletCurrency = new Prisma.Decimal(amount).div(
        gameSession.exchangeRate,
      );
      let result;

      const betTransactionResult = await this.casinoBetService.processBet(
        {
          provider: provider,
          betTime: debit_time,
          userId: gameSession.user.id,
          walletCurrency: walletCurrency,
          betAmountInGameCurrency: new Prisma.Decimal(amount),
          betAmountInWalletCurrency: betAmountInWalletCurrency,
          gameSessionId: gameSession.id,
          aggregatorTxId: round_id || txn_id,
          aggregatorBetId: txn_id,
          aggregatorType: GameAggregatorType.WHITECLIFF,
          aggregatorGameId: game_id,
          gameId: gameId,
          jackpotContributionAmount: new Prisma.Decimal(0),
          betType: BetType.NORMAL,
        },
      );

      // 특정 게임사에서 제공, 바로 win 처리
      if (credit_amount !== undefined && credit_amount !== null) {
        const winTransactionResult =
          await this.casinoBetService.processWin({
            aggregatorType: GameAggregatorType.WHITECLIFF,
            userId: gameSession.user.id,
            gameCurrency: gameSession.gameCurrency as GamingCurrencyCode,
            walletCurrency: walletCurrency,
            winAmountInWalletCurrency: new Prisma.Decimal(
              credit_amount,
            ).div(gameSession.exchangeRate),
            winAmountInGameCurrency: new Prisma.Decimal(credit_amount),
            winTime: debit_time,
            aggregatorTxId: round_id || txn_id,
            aggregatorWinId: txn_id,
            isEndRound: true,
          });

        // 라운드 완료 처리 및 큐 작업 추가
        if (winTransactionResult.gameRoundId) {
          const gameRound = await this.tx.gameRound.findUnique({
            where: {
              id: winTransactionResult.gameRoundId,
            },
            select: {
              id: true,
            },
          });

          if (gameRound) {
            await this.tx.gameRound.update({
              where: {
                id: gameRound.id,
              },
              data: {
                completedAt: parseDateStringOrThrow(debit_time),
                transaction: {
                  update: {
                    status: TransactionStatus.COMPLETED,
                  },
                },
              },
            });
          }
        }

        // 당첨 처리 후 반환
        result = {
          lastBalance: winTransactionResult.afterBonusBalance.add(
            winTransactionResult.afterMainBalance,
          ), // walletCurrency 기준
          gameRoundId: winTransactionResult.gameRoundId,
        };
      }
      else {
        // 베팅 처리 후 반환
        result = {
          lastBalance: betTransactionResult.afterBonusBalance.add(
            betTransactionResult.afterMainBalance,
          ),
        };
      }


      // credit_amount 처리 시 큐 작업 추가 (트랜잭션 밖에서)
      if (
        credit_amount !== undefined &&
        credit_amount !== null &&
        result.gameRoundId
      ) {
        await this.queueService.addWhitecliffFetchGameResultUrlJob({
          gameRoundId: result.gameRoundId.toString(),
        });

        const requiresPushBet = provider === GameProvider.EVOLUTION;

        await this.queueService.addGamePostProcessJob({
          gameRoundId: result.gameRoundId.toString(),
          waitForPushBet: requiresPushBet,
        });
      }

      return {
        status: 1,
        balance: gameSession.exchangeRate
          .mul(result.lastBalance)
          .toDecimalPlaces(2)
          .toNumber(),
      };
    } catch (error) {
      this.logger.error(error, `잔액 차감 실패`);
      const errorMessage = getCasinoErrorCode(error);
      return {
        status: 0,
        balance: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * 사용자 잔액 추가
   * @param userId 사용자 ID
   * @param amount 추가할 금액
   * @returns 거래 결과
   */
  @Transactional()
  async credit(
    body: CreditRequestDto,
    currency?: GamingCurrencyCode,
  ): Promise<TransactionResponseDto> {
    const {
      user_id,
      amount,
      prd_id,
      txn_id,
      round_id,
      is_cancel,
      credit_time,
      game_id,
      table_id,
      sid,
      desc,
    } = body;

    try {
      this.validateRequiredFields(body, ['user_id', 'amount', 'txn_id']);

      const provider =
        this.whitecliffMapperService.fromWhitecliffProvider(prd_id);

      if (!provider) {
        this.logger.error(`❌ Credit API - 잘못된 Provider ID: ${prd_id}`);
        throw new Error(CasinoErrorCode.INVALID_PRODUCT);
      }

      // 2. sid로 gameSession 우선 조회 (debit과 동일한 패턴)
      const gameSession = await this.tx.casinoGameSession.findFirst({
        where: {
          aggregatorType: GameAggregatorType.WHITECLIFF,
          token: sid, // sid로 직접 찾기
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          exchangeRate: true,
          walletCurrency: true,
          gameCurrency: true,
          user: {
            select: {
              id: true,
              whitecliffSystemId: true,
            },
          },
        },
      });

      if (!gameSession) {
        this.logger.error(
          `❌ Credit API - 게임 세션 존재하지 않음: sid=${sid}, user_id=${user_id}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      // 3. user_id 검증 (보안을 위해 - DCS의 brand_uid 검증과 동일)
      if (
        gameSession.user.whitecliffSystemId &&
        Number(gameSession.user.whitecliffSystemId) !== Number(user_id)
      ) {
        this.logger.error(
          `❌ Credit API - user_id 불일치: session_user_id=${gameSession.user.whitecliffSystemId}, request_user_id=${user_id}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      // 4. gameCurrency 검증
      if (currency && gameSession.gameCurrency !== currency) {
        this.logger.error(
          `❌ Credit API - gameCurrency 불일치: session_currency=${gameSession.gameCurrency}, request_currency=${currency}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      const walletCurrency = gameSession.walletCurrency;
      let result;
      const isCancel = is_cancel === 1; // 0 이면 지급 1 이면 취소

      if (isCancel) {
        // 취소처리
        const updatedGameTransaction =
          await this.casinoRefundService.processCancel({
            aggregatorTxId: round_id || txn_id, // round_id 우선 사용
            aggregatorBetId: txn_id,
            aggregatorType: GameAggregatorType.WHITECLIFF,
            userId: gameSession.user.id,
            gameCurrency: gameSession.gameCurrency as GamingCurrencyCode,
            cancelTime: parseDateStringOrThrow(credit_time || ''),
            isEndRound: true,
          });

        result = {
          status: 1,
          lastBalance: updatedGameTransaction.afterBonusBalance.add(
            updatedGameTransaction.afterMainBalance,
          ), // walletCurrency 기준
        };
      } else {
        const updatedGameTransaction =
          await this.casinoBetService.processWin({
            aggregatorType: GameAggregatorType.WHITECLIFF,
            userId: gameSession.user.id,
            gameCurrency: gameSession.gameCurrency as GamingCurrencyCode,
            walletCurrency: walletCurrency,
            winAmountInGameCurrency: new Prisma.Decimal(amount),
            winAmountInWalletCurrency: new Prisma.Decimal(amount).div(
              gameSession.exchangeRate,
            ),
            winTime: credit_time || '',
            aggregatorTxId: round_id || txn_id, // round_id 우선 사용
            aggregatorWinId: txn_id,
            isEndRound: true,
          });

        // 라운드 완료 처리 (debit과 동일)
        if (updatedGameTransaction.gameRoundId) {
          const gameRound = await this.tx.gameRound.findUnique({
            where: {
              id: updatedGameTransaction.gameRoundId,
            },
            select: {
              id: true,
            },
          });

          if (gameRound) {
            await this.tx.gameRound.update({
              where: {
                id: gameRound.id,
              },
              data: {
                completedAt: parseDateStringOrThrow(credit_time || ''),
                transaction: {
                  update: {
                    status: TransactionStatus.COMPLETED,
                  },
                },
              },
            });
          }
        }

        result = {
          status: 1,
          lastBalance: updatedGameTransaction.afterBonusBalance.add(
            updatedGameTransaction.afterMainBalance,
          ), // walletCurrency 기준
          gameRoundId: updatedGameTransaction.gameRoundId,
        };
      }

      // credit_amount 처리 시 큐 작업 추가 (트랜잭션 밖에서)
      if (!is_cancel && result.gameRoundId) {
        await this.queueService.addWhitecliffFetchGameResultUrlJob({
          gameRoundId: result.gameRoundId.toString(),
        });

        const requiresPushBet =
          this.whitecliffMapperService.fromWhitecliffProvider(prd_id) ===
          GameProvider.EVOLUTION;

        await this.queueService.addGamePostProcessJob({
          gameRoundId: result.gameRoundId.toString(),
          waitForPushBet: requiresPushBet,
        });
      }

      // 환율 적용하여 gameCurrency 기준 잔액 반환 (debit과 동일)
      return {
        status: result.status,
        balance: gameSession.exchangeRate
          .mul(result.lastBalance)
          .toDecimalPlaces(2)
          .toNumber(),
      };
    } catch (error) {
      this.logger.error(error, `잔액 추가 실패`);
      const errorMessage = getCasinoErrorCode(error);

      return {
        status: 0,
        balance: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * 사용자 보너스 조회
   * @param userId 사용자 ID
   * @returns 보너스 정보
   */
  @Transactional()
  async getBonus(
    body: GetBonusRequestDto,
    gameCurrency: GamingCurrencyCode,
  ): Promise<GetBonusResponseDto> {
    const {
      user_id,
      type,
      amount,
      prd_id,
      txn_id,
      round_id,
      game_id,
      sid,
      is_endround,
      freespin_id,
    } = body;

    try {
      if (!user_id || !amount || !txn_id) {
        this.logger.error('❌ Bonus API - 필수 파라미터 누락');
        throw new Error(CasinoErrorCode.PARAMETER_MISSING);
      }

      const provider =
        this.whitecliffMapperService.fromWhitecliffProvider(prd_id);

      if (!provider) {
        this.logger.error(`❌ Bonus API - 잘못된 Provider ID: ${prd_id}`);
        throw new Error(CasinoErrorCode.INVALID_PRODUCT);
      }

      // 1. 게임 조회
      const game = await this.tx.casinoGameV2.findFirst({
        where: {
          provider: {
            code: provider,
          },
          externalGameId: String(game_id),
        },
        select: {
          id: true,
        },
      });

      if (!game) {
        this.logger.error(`❌ Bonus API - 게임 존재하지 않음: ${game_id}`);
        throw new Error(CasinoErrorCode.INVALID_PRODUCT);
      }

      // 2. sid로 gameSession 우선 조회 (debit, credit과 동일한 패턴)
      const gameSession = await this.tx.casinoGameSession.findFirst({
        where: {
          aggregatorType: GameAggregatorType.WHITECLIFF,
          token: sid, // sid로 직접 찾기
          gameId: game.id, // 게임 ID도 함께 확인 (DCS 패턴)
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          exchangeRate: true,
          walletCurrency: true,
          gameCurrency: true,
          user: {
            select: {
              id: true,
              whitecliffSystemId: true,
            },
          },
        },
      });

      if (!gameSession) {
        this.logger.error(
          `❌ Bonus API - 게임 세션 존재하지 않음: sid=${sid}, user_id=${user_id}, game_id=${game_id}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      // 3. user_id 검증 (보안을 위해 - DCS의 brand_uid 검증과 동일)
      if (
        gameSession.user.whitecliffSystemId &&
        Number(gameSession.user.whitecliffSystemId) !== Number(user_id)
      ) {
        this.logger.error(
          `❌ Bonus API - user_id 불일치: session_user_id=${gameSession.user.whitecliffSystemId}, request_user_id=${user_id}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      // 4. gameCurrency 검증
      if (gameSession.gameCurrency !== gameCurrency) {
        this.logger.error(
          `❌ Bonus API - gameCurrency 불일치: session_currency=${gameSession.gameCurrency}, request_currency=${gameCurrency}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      const isEndRound = is_endround == true;

      // 0 = In Game Bonus 인 게임 보너스
      // 1 = Promotion 프로모션 보너스
      // 2 = Jackpot 잭팟 보너스
      const bonusType =
        type === 0
          ? BonusType.IN_GAME_BONUS
          : type === 1
            ? BonusType.PROMOTION
            : BonusType.JACKPOT;

      const bonusTransactionResult =
        await this.casinoBonusService.processBonus({
          userId: gameSession.user.id,
          gameCurrency: gameSession.gameCurrency as GamingCurrencyCode,
          transactionTime: nowUtc(), // Whitecliff는 시간 필드가 없으므로 현재 시간 사용
          aggregatorType: GameAggregatorType.WHITECLIFF,
          provider: provider,
          bonusType: bonusType,
          bonusAmountInGameCurrency: new Prisma.Decimal(amount),
          aggregatorRoundId: round_id,
          aggregatorTransactionId: txn_id,
          isEndRound: isEndRound,
          aggregatorFreespinId: freespin_id,
          gameId: game.id,
          gameSessionId: gameSession.id, // gameSessionId 전달
        });

      const result = {
        status: 1,
        lastBalance: bonusTransactionResult.afterMainBalance.add(
          bonusTransactionResult.afterBonusBalance,
        ), // walletCurrency 기준
      };

      // 라운드 완료 처리 (isEndRound일 때만 - DCS 패턴)
      if (isEndRound && round_id) {
        const gameRound = await this.tx.gameRound.findUnique({
          where: {
            aggregatorTxId_aggregatorType: {
              aggregatorTxId: round_id,
              aggregatorType: GameAggregatorType.WHITECLIFF,
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
                aggregatorType: GameAggregatorType.WHITECLIFF,
              },
            },
            data: {
              completedAt: nowUtc(),
              transaction: {
                update: {
                  status: TransactionStatus.COMPLETED,
                },
              },
            },
            select: {
              id: true,
            },
          });

          // 큐 작업 추가 (DCS 패턴)
          await this.queueService.addWhitecliffFetchGameResultUrlJob({
            gameRoundId: gameRound.id.toString(),
          });

          const requiresPushBet = provider === GameProvider.EVOLUTION;

          await this.queueService.addGamePostProcessJob({
            gameRoundId: gameRound.id.toString(),
            waitForPushBet: requiresPushBet,
          });
        }
      }

      // 환율 적용하여 gameCurrency 기준 잔액 반환 (debit, credit과 동일)
      return {
        status: result.status,
        balance: gameSession.exchangeRate
          .mul(result.lastBalance)
          .toDecimalPlaces(2)
          .toNumber(),
      };
    } catch (error) {
      this.logger.error(error, `보너스 조회 실패`);
      const errorMessage = getCasinoErrorCode(error);

      return {
        status: 0,
        balance: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * 비밀키 검증
   * @param secretKey 검증할 비밀키
   * @returns 검증 결과
   */
  validateSecretKey(secretKey: string) {
    // const expectedSecretKey = this.envService.whitecliff[0].secretKey;
    const config = this.envService.whitecliff.find(
      (config) => config.secretKey === secretKey,
    );

    if (!config) {
      return {
        isValid: false,
        currency: GAMING_CURRENCIES[0], // 사실 의미없음
      };
    }

    const currency =
      this.whitecliffMapperService.convertWhitecliffCurrencyToGamingCurrency(
        config.currency,
      );

    return {
      isValid: config !== undefined,
      currency: currency,
    };
  }

  /**
   * 필수 파라미터 검증
   * @param body 요청 바디
   * @param fields 필수 필드 목록
   */
  private validateRequiredFields(body: any, fields: string[]) {
    for (const field of fields) {
      if (body[field] === undefined || body[field] === null) {
        this.logger.error(`❌ 파라미터 누락: ${field}`);
        throw new Error(CasinoErrorCode.PARAMETER_MISSING);
      }
    }
  }
}
