import { Injectable, Logger } from '@nestjs/common';
import { EnvService } from 'src/common/env/env.service';
import {
  WagerRequestDto,
  WagerResponseDto,
  CancelWagerRequestDto,
  CancelWagerResponseDto,
  AppendWagerRequestDto,
  AppendWagerResponseDto,
  EndWagerRequestDto,
  EndWagerResponseDto,
  FreeSpinResultRequestDto,
  FreeSpinResultResponseDto,
  GetDcsBalanceRequestDto,
  GetDcsBalanceResponseDto,
  PromoPayoutRequestDto,
  PromoPayoutResponseDto,
  DcsCommonResponseDto,
} from '../dtos/callback.dto';
import { DcsConfig } from 'src/common/env/env.types';
import * as crypto from 'crypto';
import {
  DcsResponseCode,
  getDcsResponse,
} from '../constants/dcs-response-codes';

import { DcsMapperService } from '../infrastructure/dcs-mapper.service';
import { QueueService } from 'src/infrastructure/queue/queue.service';
import { CasinoBetService } from '../../application/casino-bet.service';
import {
  BetType,
  BonusType,
  GameAggregatorType,
  Prisma,
  TransactionStatus,
} from '@repo/database';
import { CasinoRefundService } from '../../application/casino-refund.service';
import { parseDateStringOrThrow } from 'src/utils/date.util';
import { CasinoBonusService } from '../../application/casino-bonus.service';
import { WalletCurrencyCode } from 'src/utils/currency.util';
import { CasinoErrorCode } from '../../constants/casino-error-codes';
import { FindCasinoGameSessionService } from '../../application/find-casino-game-session.service';
import { GetUserBalanceService } from 'src/modules/wallet/application/get-user-balance.service';
import { InjectTransaction, Transactional } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { InsufficientBalanceException } from 'src/modules/wallet/domain/wallet.exception';

@Injectable()
export class DcsCallbackService {
  private readonly logger = new Logger(DcsCallbackService.name);
  private readonly dcsConfig: DcsConfig;

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly envService: EnvService,
    private readonly dcsMapperService: DcsMapperService,
    private readonly queueService: QueueService,
    private readonly casinoBetService: CasinoBetService,
    private readonly casinoRefundService: CasinoRefundService,
    private readonly casinoBonusService: CasinoBonusService,
    private readonly findCasinoGameSessionService: FindCasinoGameSessionService,
    private readonly getUserBalanceService: GetUserBalanceService,
  ) {
    this.dcsConfig = this.envService.dcs;
  }

  /**
   * Sign 검증 함수
   * Sign = MD5(brand_id + 파라미터들(순서대로) + api_key)
   * @param brand_id 브랜드 ID
   * @param sign 검증할 sign 값
   * @param additionalParams 추가 파라미터들 (가변적, 순서 중요)
   * @returns 검증 결과 (true: 유효, false: 무효)
   */
  verifySign(
    brand_id: string,
    sign: string,
    ...additionalParams: (string | number | undefined)[]
  ): null | DcsCommonResponseDto {
    // 1. env의 brandId와 입력받은 brand_id 비교
    if (this.dcsConfig.brandId !== brand_id) {
      return getDcsResponse(DcsResponseCode.BRAND_NOT_EXIST);
    }

    // 2. env의 brandId + 가변 파라미터들(순서대로) + env의 apiKey 문자열 합성
    const baseString =
      this.dcsConfig.brandId +
      additionalParams
        .filter((param) => param !== undefined && param !== null)
        .map((param) => String(param))
        .join('') +
      this.dcsConfig.apiKey;

    // 3. MD5 해시 생성
    const calculatedSign = crypto
      .createHash('md5')
      .update(baseString)
      .digest('hex');

    // 4. 생성한 해시와 입력받은 sign 비교
    const isValid = calculatedSign.toLowerCase() === sign.toLowerCase();

    if (!isValid) {
      return getDcsResponse(DcsResponseCode.SIGN_ERROR);
    }

    return null;
  }

  /**
   * 필수 파라미터 검증
   */
  validateRequiredFields(
    body: any,
    requiredFields: string[],
  ): DcsCommonResponseDto | null {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const value = body[field];
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      this.logger.warn(`필수 파라미터 누락: ${missingFields.join(', ')}`);
      return getDcsResponse(DcsResponseCode.REQUEST_PARAM_ERROR);
    }

    return null;
  }

  /**
   * Wager 콜백 (베팅)
   */
  @Transactional()
  async wager(body: WagerRequestDto): Promise<WagerResponseDto> {
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

    const gameCurrencyEnum =
      this.dcsMapperService.convertDcsCurrencyToGamingCurrency(currency);
    const providerEnum = this.dcsMapperService.fromDcsProvider(provider)!;

    const jackpotContributionAmount = new Prisma.Decimal(
      jackpot_contribution ?? 0,
    );

    const gameSession = await this.findCasinoGameSessionService.findByToken(token);

    if (!gameSession) {
      this.logger.error(`❌ Login API - 게임 세션 존재하지 않음: ${brand_uid}`);
      return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
    }

    if (gameSession.aggregatorType !== GameAggregatorType.DCS) {
      this.logger.error(
        `❌ Login API - 게임 세션 타입 불일치: ${gameSession.aggregatorType}`,
      );
      return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
    }

    // token 불일치
    // 토큰이 다른 유저꺼임
    if (gameSession.playerName !== brand_uid) {
      this.logger.error(`❌ Login API - 토큰 불일치: ${brand_uid}`);
      return getDcsResponse(DcsResponseCode.NOT_LOGGED_IN);
    }

    try {
      const betTransactionResult = await this.casinoBetService.processBet(
        {
          userId: gameSession.userId,
          betAmountInGameCurrency: new Prisma.Decimal(amount),
          betAmountInWalletCurrency: new Prisma.Decimal(amount).div(
            gameSession.exchangeRate,
          ),
          walletCurrency: gameSession.walletCurrency,
          gameSessionId: gameSession.id!,
          aggregatorTxId: round_id,
          aggregatorBetId: wager_id,
          aggregatorType: GameAggregatorType.DCS,
          aggregatorGameId: game_id,
          provider: providerEnum,
          gameId: gameSession.casinoGameId!,
          betTime: transaction_time,
          jackpotContributionAmount,
          betType: bet_type === 1 ? BetType.NORMAL : BetType.TIP,
        },
      );

      return getDcsResponse(DcsResponseCode.SUCCESS, {
        balance: gameSession.exchangeRate.mul(
          betTransactionResult.afterMainBalance.add(
            betTransactionResult.afterBonusBalance,
          ),
        ),
        brand_uid,
        currency,
      });
    } catch (error) {
      this.logger.error(error, `Wager 콜백 실패`);

      const balanceResult = await this.getUserBalanceService.execute({
        userId: gameSession.userId,
        currency: gameSession.walletCurrency,
      });

      const userWallet = Array.isArray(balanceResult.wallet)
        ? balanceResult.wallet[0]
        : balanceResult.wallet;

      let balance = new Prisma.Decimal(0);
      if (userWallet) {
        balance = gameSession.exchangeRate.mul(userWallet.totalBalance);
      }

      if (error instanceof InsufficientBalanceException) {
        return getDcsResponse(DcsResponseCode.BALANCE_INSUFFICIENT, {
          brand_uid,
          currency,
          balance,
        });
      }

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

  /**
   * Cancel Wager 콜백 (베팅 취소)
   */
  @Transactional()
  async cancelWager(
    body: CancelWagerRequestDto,
  ): Promise<CancelWagerResponseDto> {
    const {
      brand_uid,
      wager_id,
      currency,
      round_id,
      wager_type,
      is_endround,
      transaction_time,
    } = body;

    const currencyEnum =
      this.dcsMapperService.convertDcsCurrencyToGamingCurrency(currency);

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
            uid: true,
            exchangeRate: true,
            walletCurrency: true,
            userId: true,
            playerName: true,
          },
        },
      },
    });

    try {
      if (!gameRound) {
        throw new Error(CasinoErrorCode.INVALID_TXN);
      }

      const gameSession = gameRound.GameSession;

      // brand_uid 검증 (보안을 위해)
      if (gameSession.playerName !== brand_uid) {
        throw new Error(CasinoErrorCode.INVALID_TXN);
      }
      // 1=cancelWager, 2=cancelEndWager
      if (wager_type == 1) {
        // 게임 일반 취소
        // 이전에 차감했던 베팅 금액을 플레이어의 지갑으로 돌려줍니다.
        const cancelTransactionResult =
          await this.casinoRefundService.processCancel({
            userId: gameSession.userId,
            gameCurrency: currencyEnum,
            aggregatorTxId: round_id,
            aggregatorBetId: wager_id,
            aggregatorType: GameAggregatorType.DCS,
            cancelTime: parseDateStringOrThrow(transaction_time),
            isEndRound: is_endround,
          });
        return getDcsResponse(DcsResponseCode.SUCCESS, {
          balance: gameSession.exchangeRate.mul(
            cancelTransactionResult.afterMainBalance.add(
              cancelTransactionResult.afterBonusBalance,
            ),
          ),
          brand_uid,
          currency,
        });
      } else {
        // 게임 종료 취소
        // 플레이어의 지갑에서 금액을 다시 차감합니다.
        // 보너스 콤프 이런거 지급했던거 다 롤백해야함.
        const cancelTransactionResult =
          await this.casinoRefundService.processCancel({
            userId: gameSession.userId,
            gameCurrency: currencyEnum,
            aggregatorTxId: round_id,
            aggregatorBetId: wager_id,
            aggregatorType: GameAggregatorType.DCS,
            cancelTime: parseDateStringOrThrow(transaction_time),
            isEndRound: is_endround,
          });
        return getDcsResponse(DcsResponseCode.SUCCESS, {
          balance: gameSession.exchangeRate.mul(
            cancelTransactionResult.afterMainBalance.add(
              cancelTransactionResult.afterBonusBalance,
            ),
          ),
          brand_uid,
          currency,
        });
      }
    } catch (error) {
      this.logger.error(`❌ Cancel Wager API 실패:`, error);

      // gameSession이 이미 있으므로 이를 활용하여 실제 밸런스 조회
      let balance = new Prisma.Decimal(0);
      const gameSession = gameRound?.GameSession;

      if (gameSession) {
        const balanceResult = await this.getUserBalanceService.execute({
          userId: gameSession.userId,
          currency: gameSession.walletCurrency,
        });

        const userWallet = Array.isArray(balanceResult.wallet)
          ? balanceResult.wallet[0]
          : balanceResult.wallet;

        if (userWallet) {
          balance = gameSession.exchangeRate.mul(userWallet.totalBalance);
        }
      }

      if (balance.equals(0)) {
        // 유저 월렛 중 잔액이 가장 큰 월렛 찾아서
        // 게임 커런시로 변환해서 반환 처리.

        const user = await this.tx.user.findUnique({
          where: {
            dcsId: brand_uid,
          },
          select: {
            id: true,
            balances: {
              select: {
                currency: true,
                mainBalance: true,
                bonusBalance: true,
              },
            },
          },
        });

        if (user && user.balances.length > 0) {
          // 각 월렛의 총 잔액 계산 및 가장 큰 잔액 찾기
          let maxBalance = new Prisma.Decimal(0);
          let maxBalanceCurrency: WalletCurrencyCode | null = null;

          for (const userBalance of user.balances) {
            const totalBalance = userBalance.mainBalance.add(
              userBalance.bonusBalance,
            );
            if (totalBalance.gt(maxBalance)) {
              maxBalance = totalBalance;
              maxBalanceCurrency = userBalance.currency;
            }
          }

          // 가장 큰 잔액을 가진 월렛이 있고, 잔액이 0보다 큰 경우
          if (maxBalanceCurrency && maxBalance.gt(0)) {
            // 해당 currency로 gameSession 찾기
            const maxBalanceGameSession =
              await this.tx.casinoGameSession.findFirst({
                where: {
                  userId: user.id,
                  aggregatorType: GameAggregatorType.DCS,
                  gameCurrency: currencyEnum,
                  walletCurrency: maxBalanceCurrency,
                },
                select: {
                  exchangeRate: true,
                },
              });

            if (maxBalanceGameSession) {
              // 게임 커런시로 변환
              balance = maxBalanceGameSession.exchangeRate.mul(maxBalance);
            }
          }
        }
      }

      const errorMessage = error.message;
      switch (errorMessage) {
        case 'INVALID_USER':
        case 'INVALID_TXN':
          return getDcsResponse(DcsResponseCode.BET_RECORD_NOT_EXIST, {
            balance,
            brand_uid,
            currency,
          });
        case 'BET_ALREADY_CANCELLED':
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

  /**
   * Append Wager 콜백 (추가 베팅)
   */
  @Transactional()
  async appendWager(
    body: AppendWagerRequestDto,
  ): Promise<AppendWagerResponseDto> {
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

    const currencyEnum =
      this.dcsMapperService.convertDcsCurrencyToGamingCurrency(currency);
    const providerEnum = this.dcsMapperService.fromDcsProvider(provider)!;
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
            userId: true,
            playerName: true,
          },
        },
        casinoGame: {
          select: {
            id: true,
            gameId: true,
          },
        },
      },
    });

    if (!gameRound) {
      this.logger.error(
        `❌ Append Wager API - 게임 라운드 존재하지 않음: ${round_id}`,
      );
      return getDcsResponse(DcsResponseCode.BET_RECORD_NOT_EXIST);
    }

    const gameSession = gameRound.GameSession;

    // brand_uid 검증 (보안을 위해)
    if (gameSession.playerName !== brand_uid) {
      return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
    }

    // 게임 ID 검증
    if (!gameRound.casinoGame || gameRound.casinoGame.gameId !== game_id) {
      return getDcsResponse(DcsResponseCode.GAME_ID_NOT_EXIST);
    }

    try {
      const bonusResult = await this.casinoBonusService.processBonus({
        userId: gameSession.userId,
        gameCurrency: currencyEnum,
        transactionTime: parseDateStringOrThrow(transaction_time),
        aggregatorType: GameAggregatorType.DCS,
        provider: providerEnum,
        bonusType: BonusType.PROMOTION,
        bonusAmountInGameCurrency: new Prisma.Decimal(amount),
        aggregatorRoundId: round_id,
        aggregatorWagerId: wager_id,
        isEndRound: isEndRound,
        gameId: gameRound.casinoGame!.id,
        description: description,
        gameSessionId: gameRound.GameSession.id, // 추가
      });

      const result = {
        response: getDcsResponse(DcsResponseCode.SUCCESS, {
          balance: gameSession.exchangeRate.mul(
            bonusResult.afterMainBalance.add(
              bonusResult.afterBonusBalance,
            ),
          ),
          brand_uid,
          currency,
        }),
      };

      if (isEndRound) {
        const updatedGameRound = await this.tx.gameRound.update({
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
          select: {
            id: true,
          },
        });

        await this.queueService.addDcsFetchGameReplayUrlJob({
          gameRoundId: updatedGameRound.id.toString(),
        });

        await this.queueService.addGamePostProcessJob({
          gameRoundId: updatedGameRound.id.toString(),
          waitForPushBet: false,
        });
      }

      return result.response;
    } catch (error) {
      this.logger.error(`❌ Append Wager API 실패:`, error);

      // gameSession이 이미 있으므로 이를 활용하여 실제 밸런스 조회
      let balance = new Prisma.Decimal(0);

      if (gameSession) {
        const balanceResult = await this.getUserBalanceService.execute({
          userId: gameSession.userId,
          currency: gameSession.walletCurrency,
        });

        const userWallet = Array.isArray(balanceResult.wallet)
          ? balanceResult.wallet[0]
          : balanceResult.wallet;

        if (userWallet) {
          balance = gameSession.exchangeRate.mul(userWallet.totalBalance);
        }
      }

      const errorMessage = error.message;
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

  /**
   * End Wager 콜백 (베팅 종료 및 지급)
   */
  @Transactional()
  async endWager(body: EndWagerRequestDto): Promise<EndWagerResponseDto> {
    const {
      brand_uid,
      currency,
      amount,
      round_id,
      wager_id,
      is_endround,
      transaction_time,
    } = body;

    const gameCurrencyEnum =
      this.dcsMapperService.convertDcsCurrencyToGamingCurrency(currency);
    const isEndRound = is_endround === true;

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
            exchangeRate: true,
            walletCurrency: true,
            userId: true,
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
        throw new Error(CasinoErrorCode.INVALID_TXN);
      }

      const gameSession = gameRound.GameSession;

      const winTransactionResult = await this.casinoBetService.processWin(
        {
          userId: gameSession.userId,
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
        },
      );

      const result = {
        response: getDcsResponse(DcsResponseCode.SUCCESS, {
          balance: gameSession.exchangeRate.mul(
            winTransactionResult.afterMainBalance.add(
              winTransactionResult.afterBonusBalance,
            ),
          ),
          brand_uid,
          currency,
        }),
        gameRoundId: winTransactionResult.gameRoundId,
      };

      // 게임 라운드가 종료된 경우에만 큐 추가
      if (isEndRound && result.gameRoundId) {
        // 1. 게임 리플레이 URL 조회 큐 추가
        await this.queueService.addDcsFetchGameReplayUrlJob({
          gameRoundId: result.gameRoundId.toString(),
        });

        // 2. 게임 후처리 큐 추가 (콤프, 롤링, VIP 등)
        await this.queueService.addGamePostProcessJob({
          gameRoundId: result.gameRoundId.toString(),
          waitForPushBet: false,
        });
      }

      return result.response;
    } catch (error) {
      this.logger.error(`❌ End Wager API 실패:`, error);

      // gameRound가 없을 수도 있으므로, brand_uid로 사용자를 찾아서 밸런스를 가져옴
      let balance = new Prisma.Decimal(0);

      if (gameRound) {
        // gameRound가 존재하는 경우 (DUPLICATE_CREDIT 등)
        const balanceResult = await this.getUserBalanceService.execute({
          userId: gameRound.GameSession.userId,
          currency: gameRound.GameSession.walletCurrency,
        });

        const userWallet = Array.isArray(balanceResult.wallet)
          ? balanceResult.wallet[0]
          : balanceResult.wallet;

        if (userWallet) {
          balance = gameRound.GameSession.exchangeRate.mul(
            userWallet.totalBalance,
          );
        }
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
          // gameCurrency로 walletCurrency를 추론하거나, 기본값 사용
          // 또는 GameSession을 조회해서 exchangeRate와 walletCurrency를 가져올 수 있음
          const gameSession = await this.tx.casinoGameSession.findFirst({
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

          if (gameSession) {
            const balanceResult = await this.getUserBalanceService.execute({
              userId: user.id,
              currency: gameSession.walletCurrency,
            });

            const userWallet = Array.isArray(balanceResult.wallet)
              ? balanceResult.wallet[0]
              : balanceResult.wallet;

            if (userWallet) {
              balance = gameSession.exchangeRate.mul(userWallet.totalBalance);
            }
          }
        }
      }

      switch (error.message) {
        case 'INVALID_TXN':
          return getDcsResponse(DcsResponseCode.BET_RECORD_NOT_EXIST, {
            balance,
            brand_uid,
            currency,
          });
        case 'DUPLICATE_CREDIT':
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

  /**
   * Free Spin Result 콜백 (무료 스핀 결과)
   */
  @Transactional()
  async freeSpinResult(
    body: FreeSpinResultRequestDto,
  ): Promise<FreeSpinResultResponseDto> {
    const {
      brand_uid,
      currency,
      amount,
      freespin_id,
      transaction_time,
      game_id,
      game_name,
      round_id,
      wager_id,
      provider,
      is_endround,
      freespin_description,
    } = body;
    const gameCurrencyEnum =
      this.dcsMapperService.convertDcsCurrencyToGamingCurrency(currency);
    const providerEnum = this.dcsMapperService.fromDcsProvider(provider)!;
    const isEndRound = is_endround === true;

    // 1. 사용자 조회
    const user = await this.tx.user.findUnique({
      where: { dcsId: brand_uid },
      select: {
        id: true,
      },
    });

    if (!user) {
      return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
    }

    // 2. 게임 조회
    const game = await this.tx.casinoGame.findFirst({
      where: {
        aggregatorType: GameAggregatorType.DCS,
        provider: providerEnum,
        gameId: game_id,
      },
      select: {
        id: true,
        gameId: true,
      },
    });

    if (!game) {
      return getDcsResponse(DcsResponseCode.GAME_ID_NOT_EXIST);
    }

    // 3. 게임 세션 찾기 (최근 세션)
    const gameSession = await this.tx.casinoGameSession.findFirst({
      where: {
        userId: user.id,
        aggregatorType: GameAggregatorType.DCS,
        gameCurrency: gameCurrencyEnum,
        casinoGameId: game.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        exchangeRate: true,
        walletCurrency: true,
        userId: true,
        playerName: true,
      },
    });

    if (!gameSession) {
      return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
    }

    // brand_uid 검증 (보안을 위해)
    if (gameSession.playerName !== brand_uid) {
      return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
    }

    try {
      const bonusResult = await this.casinoBonusService.processBonus({
        userId: gameSession.userId,
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

      const result = {
        response: getDcsResponse(DcsResponseCode.SUCCESS, {
          balance: gameSession.exchangeRate.mul(
            bonusResult.afterMainBalance.add(
              bonusResult.afterBonusBalance,
            ),
          ),
          brand_uid,
          currency,
        }),
      };

      // isEndRound일 때 게임 라운드 완료 처리 및 큐 작업 추가
      // round_id로 gameRound를 찾아서 업데이트 (존재하는 경우에만)
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
          const updatedGameRound =
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
              select: {
                id: true,
              },
            });

          await this.queueService.addDcsFetchGameReplayUrlJob({
            gameRoundId: updatedGameRound.id.toString(),
          });

          await this.queueService.addGamePostProcessJob({
            gameRoundId: updatedGameRound.id.toString(),
            waitForPushBet: false,
          });
        }
      }

      return result.response;
    } catch (error) {
      this.logger.error(`❌ Free Spin Result API 실패:`, error);

      // gameSession이 이미 있으므로 이를 활용하여 실제 밸런스 조회
      let balance = new Prisma.Decimal(0);

      if (gameSession) {
        const balanceResult = await this.getUserBalanceService.execute({
          userId: gameSession.userId,
          currency: gameSession.walletCurrency,
        });

        const userWallet = Array.isArray(balanceResult.wallet)
          ? balanceResult.wallet[0]
          : balanceResult.wallet;

        if (userWallet) {
          balance = gameSession.exchangeRate.mul(userWallet.totalBalance);
        }
      }

      const errorMessage = error.message;
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

  /**
   * Get Balance 콜백 (잔액 조회)
   */
  async getBalance(
    body: GetDcsBalanceRequestDto,
  ): Promise<GetDcsBalanceResponseDto> {
    const { brand_uid, token, currency } = body;
    try {
      const gameSession = await this.findCasinoGameSessionService.findByToken(token);

      if (!gameSession) {
        this.logger.error(
          `❌ Get Balance API - 게임 세션 존재하지 않음: ${brand_uid}`,
        );
        return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
      }

      // token 불일치
      // 토큰이 다른 유저꺼임
      if (gameSession.playerName !== brand_uid) {
        this.logger.error(`❌ Get Balance API - 토큰 불일치: ${brand_uid}`);
        return getDcsResponse(DcsResponseCode.NOT_LOGGED_IN);
      }

      const balanceResult = await this.getUserBalanceService.execute({
        userId: gameSession.userId,
        currency: gameSession.walletCurrency,
      });

      // currency를 지정했으므로 단일 UserWallet 반환됨
      // Array.isArray 체크를 통해 타입 안전성 확보 (혹은 as UserWallet)
      const userWallet = Array.isArray(balanceResult.wallet)
        ? balanceResult.wallet[0]
        : balanceResult.wallet;

      if (!userWallet) {
        this.logger.error(`❌ Get Balance API - 지갑 생성 실패: ${brand_uid}`);
        return getDcsResponse(DcsResponseCode.SYSTEM_ERROR);
      }

      const exchangeRateBalance = gameSession.exchangeRate.mul(
        userWallet.totalBalance
      );

      return getDcsResponse(DcsResponseCode.SUCCESS, {
        brand_uid,
        currency,
        balance: exchangeRateBalance,
      });
    } catch (error) {
      this.logger.error(error, `Get Balance 콜백 실패`);
      switch (error.message) {
        case 'USER_BALANCE_NOT_FOUND':
          return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
        default:
          return getDcsResponse(DcsResponseCode.SYSTEM_ERROR);
      }
    }
  }

  /**
   * Promo Payout 콜백 (프로모션 지급)
   */
  @Transactional()
  async promoPayout(
    body: PromoPayoutRequestDto,
  ): Promise<PromoPayoutResponseDto> {
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
      this.dcsMapperService.convertDcsCurrencyToGamingCurrency(currency);
    const providerEnum = this.dcsMapperService.fromDcsProvider(provider)!;
    const transactionTime = parseDateStringOrThrow(transaction_time);
    const bonusAmount = new Prisma.Decimal(amount);

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
      const gameSession = await this.tx.casinoGameSession.findFirst({
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

      return getDcsResponse(DcsResponseCode.SUCCESS, {
        balance,
        brand_uid,
        currency,
      });
    } catch (error) {
      this.logger.error(`❌ Promo Payout API 실패:`, error);
      const errorMessage = error.message;
      switch (errorMessage) {
        case 'BONUS_ALREADY_PROCESSED': {
          // 이미 처리된 보너스인 경우에도 실제 사용자 잔액 반환
          try {
            const gameSession = await this.tx.casinoGameSession.findFirst({
              where: {
                userId: user.id,
                aggregatorType: GameAggregatorType.DCS,
                gameCurrency: gameCurrencyEnum,
              },
              select: {
                exchangeRate: true,
                walletCurrency: true,
              },
            });

            if (gameSession) {
              const balanceResult = await this.getUserBalanceService.execute({
                userId: user.id,
                currency: gameSession.walletCurrency,
              });

              const userWallet = Array.isArray(balanceResult.wallet)
                ? balanceResult.wallet[0]
                : balanceResult.wallet;

              if (userWallet) {
                const exchangeRateBalance = gameSession.exchangeRate.mul(
                  userWallet.totalBalance,
                );

                return getDcsResponse(DcsResponseCode.BET_RECORD_DUPLICATE, {
                  balance: exchangeRateBalance,
                  brand_uid,
                  currency,
                });
              }
            }
          } catch (balanceError) {
            this.logger.error(
              `❌ Promo Payout API - 잔액 조회 실패:`,
              balanceError,
            );
          }

          // gameSession을 찾을 수 없거나 잔액 조회 실패 시 0 반환
          return getDcsResponse(DcsResponseCode.BET_RECORD_DUPLICATE, {
            balance: 0,
            brand_uid,
            currency,
          });
        }
        default:
          return getDcsResponse(DcsResponseCode.SYSTEM_ERROR);
      }
    }
  }
}
