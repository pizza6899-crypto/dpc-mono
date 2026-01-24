import { Injectable, Logger, Inject } from '@nestjs/common';
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
} from '../dtos';
import { DcsConfig } from 'src/common/env/env.types';
import * as crypto from 'crypto';
import {
  DcsResponseCode,
  getDcsResponse,
} from '../constants/dcs-response-codes';

import { DcsMapperService } from '../infrastructure/dcs-mapper.service';
import {
  GameAggregatorType,
  Prisma,
  GameProvider,
} from '@prisma/client';
import { CheckCasinoBalanceService } from '../../../application/check-casino-balance.service';
import { FindCasinoGameSessionService } from '../../../game-session/application/find-casino-game-session.service';
import { CasinoErrorCode } from '../../../constants/casino-error-codes';
import { InsufficientBalanceException } from 'src/modules/wallet/domain/wallet.exception';
import { ProcessCasinoBetService } from '../../../application/process-casino-bet.service';
import { ProcessCasinoCreditService } from '../../../application/process-casino-credit.service';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../../../ports/out/game-round.repository.token';
import { type GameRoundRepositoryPort } from '../../../ports/out/game-round.repository.port';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

@Injectable()
export class DcsCallbackService {
  private readonly logger = new Logger(DcsCallbackService.name);
  private readonly dcsConfig: DcsConfig;

  constructor(
    private readonly envService: EnvService,
    private readonly dcsMapperService: DcsMapperService,
    private readonly findCasinoGameSessionService: FindCasinoGameSessionService,
    private readonly checkCasinoBalanceService: CheckCasinoBalanceService,
    private readonly processCasinoBetService: ProcessCasinoBetService,
    private readonly processCasinoCreditService: ProcessCasinoCreditService,
    private readonly dispatchLogService: DispatchLogService,
    @Inject(GAME_ROUND_REPOSITORY_TOKEN)
    private readonly gameRoundRepository: GameRoundRepositoryPort,
  ) {
    this.dcsConfig = this.envService.dcs;
  }

  private async getSession(body: any): Promise<any> {
    // 1. Token 우선 조회 (Wager 등 토큰이 포함된 요청)
    if (body.token) {
      const session = await this.findCasinoGameSessionService.findByToken(body.token);
      if (session) return session;
    }

    // 2. Round ID 기반 세션 추적 (Cancel, EndWager 등 토큰이 없는 요청 처리)
    // 현재 진행 중인 라운드의 세션 ID를 통해 세션 엔티티를 정확히 복구합니다.
    if (body.round_id) {
      const round = await this.gameRoundRepository.findLatestByExternalId(
        body.round_id,
        GameAggregatorType.DC,
      );
      if (round && round.gameSessionId) {
        const session = await this.findCasinoGameSessionService.findByid(round.gameSessionId);
        if (session) return session;
      }
    }

    // 3. 마지막 수단: 토큰/라운드 모두 실패 시 brand_uid(player name) 기반 최근 세션 조회
    if (body.brand_uid) {
      return await this.findCasinoGameSessionService.findRecentByPlayerName(
        body.brand_uid,
        GameAggregatorType.DC,
      );
    }
    return null;
  }

  /**
   * Sign 검증 함수
   */
  verifySign(
    brand_id: string,
    sign: string,
    ...additionalParams: (string | number | undefined)[]
  ): null | DcsCommonResponseDto {
    if (this.dcsConfig.brandId !== brand_id) {
      return getDcsResponse(DcsResponseCode.BRAND_NOT_EXIST);
    }

    const baseString =
      this.dcsConfig.brandId +
      additionalParams
        .filter((param) => param !== undefined && param !== null)
        .map((param) => String(param))
        .join('') +
      this.dcsConfig.apiKey;

    const calculatedSign = crypto
      .createHash('md5')
      .update(baseString)
      .digest('hex');

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
   * 통합 검증 헬퍼 (필수 필드 + 서명)
   */
  private verifyAndValidate(
    body: any,
    requiredFields: string[],
    signParams: (string | number | undefined)[],
  ): DcsCommonResponseDto | null {
    // 1. 필수 필드 검증
    const validationError = this.validateRequiredFields(body, requiredFields);
    if (validationError) return validationError;

    // 2. 서명 검증
    const signVerificationError = this.verifySign(
      body.brand_id,
      body.sign,
      ...signParams,
    );
    if (signVerificationError) return signVerificationError;

    return null;
  }

  /**
   * Login 콜백
   */
  async login(body: any): Promise<any> {
    try {
      const error = this.verifyAndValidate(
        body,
        ['brand_id', 'sign', 'token', 'brand_uid', 'currency'],
        [body.token],
      );
      if (error) return error;

      return await this.getBalance({ ...body });
    } catch (error) {
      return this.handleError(error, body.brand_uid, body.currency, body);
    }
  }

  /**
   * Wager 콜백 (베팅)
   */
  async wager(body: WagerRequestDto): Promise<WagerResponseDto> {
    try {
      // 1. 통합 검증 (필수값 + 서명)
      const error = this.verifyAndValidate(
        body,
        [
          'brand_id',
          'wager_id',
          'amount',
          'token',
          'round_id',
          'game_id',
          'transaction_time',
          'provider',
          'sign',
        ],
        [body.wager_id],
      );
      if (error) return error;

      // 2. 세션 조회
      const session = await this.getSession(body);
      if (!session) {
        this.logger.warn(`DCS Wager - Session not found: token=${body.token}`);
        return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
      }

      // [SECURITY FIX] 세션 소유 및 통화 검증
      if (session.playerName !== body.brand_uid) {
        this.logger.error(`[DCS] UserID Mismatch: Request=${body.brand_uid}, Session=${session.playerName}`);
        return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
      }
      if (session.gameCurrency !== body.currency) {
        this.logger.error(`[DCS] Currency Mismatch: Request=${body.currency}, Session=${session.gameCurrency}`);
        return getDcsResponse(DcsResponseCode.REQUEST_PARAM_ERROR);
      }

      // 3. 베팅 시간 파싱
      const betTime = new Date(body.transaction_time);
      if (isNaN(betTime.getTime())) {
        this.logger.warn(`Invalid transaction_time: ${body.transaction_time}`);
      }

      // 4. Provider 매핑
      const provider =
        this.dcsMapperService.fromDcsProvider(body.provider) ||
        GameProvider.PRAGMATIC_PLAY_SLOTS;

      // 5. 베팅 처리 서비스 호출
      const result = await this.processCasinoBetService.execute({
        session: session,
        amount: new Prisma.Decimal(body.amount.toString()),
        transactionId: body.wager_id,
        roundId: body.round_id,
        gameId: BigInt(body.game_id),
        betTime: isNaN(betTime.getTime()) ? new Date() : betTime,
        provider: provider,
        isEndRound: body.is_endround,
        description: body.game_name || 'DCS Wager',
      });

      // 6. 성공 응답
      return getDcsResponse(DcsResponseCode.SUCCESS, {
        balance: result.balance,
        brand_uid: session.playerName,
        currency: body.currency,
        wager_id: body.wager_id,
      });
    } catch (error) {
      return this.handleError(error, body.brand_uid, body.currency, body);
    }
  }

  /**
   * Cancel Wager 콜백 (베팅 취소)
   */
  async cancelWager(
    body: CancelWagerRequestDto,
  ): Promise<CancelWagerResponseDto> {
    try {
      const error = this.verifyAndValidate(
        body,
        ['brand_id', 'wager_id', 'round_id', 'sign', 'wager_type'],
        [body.wager_id],
      );
      if (error) return error;

      const session = await this.getSession(body);
      if (!session) return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);

      // [SECURITY FIX] 세션 소유 및 통화 검증
      if (session.playerName !== body.brand_uid) return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
      if (session.gameCurrency !== body.currency) return getDcsResponse(DcsResponseCode.REQUEST_PARAM_ERROR);

      if (body.wager_type === 1 || body.wager_type === 2) {
        // [Refactored] DCS Cancel Wager (Refund)
        // 실제 환불 대상 검증, 중복 체크, 금액 조회 로직은 ProcessCasinoCreditService에서 통합 처리됩니다.
        const result = await this.processCasinoCreditService.execute({
          session,
          amount: new Prisma.Decimal(0),
          transactionId: body.wager_id,
          roundId: body.round_id,
          gameId: session.gameId || BigInt(0),
          winTime: body.transaction_time ? new Date(body.transaction_time) : new Date(),
          provider: this.dcsMapperService.fromDcsProvider(body.provider) || GameProvider.PRAGMATIC_PLAY_SLOTS,
          isCancel: true,
          isEndRound: body.is_endround, // DCS TransactionBase에서 상속받은 필드 사용
          description: body.wager_type === 2 ? 'DCS Cancel End Wager' : 'DCS Cancel Wager',
        });

        return getDcsResponse(DcsResponseCode.SUCCESS, {
          balance: result.balance,
          brand_uid: session.playerName,
          currency: body.currency,
          wager_id: body.wager_id,
        });
      } else {
        this.logger.warn(`Unsupported wager_type for cancelWager: ${body.wager_type}`);
        return getDcsResponse(DcsResponseCode.REQUEST_PARAM_ERROR);
      }
    } catch (error) {
      return this.handleError(error, body.brand_uid, body.currency, body);
    }
  }

  /**
   * Append Wager 콜백 (추가 베팅)
   */
  async appendWager(
    body: AppendWagerRequestDto,
  ): Promise<AppendWagerResponseDto> {
    try {
      const error = this.verifyAndValidate(
        body,
        ['brand_id', 'wager_id', 'round_id', 'amount', 'sign'],
        [body.wager_id],
      );
      if (error) return error;

      const session = await this.getSession(body);
      if (!session) return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);

      // [SECURITY FIX] 세션 소유 및 통화 검증
      if (session.playerName !== body.brand_uid) return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
      if (session.gameCurrency !== body.currency) return getDcsResponse(DcsResponseCode.REQUEST_PARAM_ERROR);

      // 추가 베팅 처리
      const result = await this.processCasinoBetService.execute({
        session: session,
        amount: new Prisma.Decimal(body.amount.toString()),
        transactionId: body.wager_id,
        roundId: body.round_id, // 기존 라운드 ID 사용
        gameId: BigInt(body.game_id),
        betTime: new Date(), // AppendWager에는 transaction_time이 DcsTransactionBaseDto에 포함됨 (body.transaction_time 사용 가능)
        provider:
          this.dcsMapperService.fromDcsProvider(body.provider) ||
          GameProvider.PRAGMATIC_PLAY_SLOTS,
        isEndRound: body.is_endround,
        description: body.description || 'DCS Append Wager',
      });

      return getDcsResponse(DcsResponseCode.SUCCESS, {
        balance: result.balance,
        brand_uid: session.playerName,
        currency: body.currency,
        wager_id: body.wager_id,
      });
    } catch (error) {
      return this.handleError(error, body.brand_uid, body.currency, body);
    }
  }

  /**
   * End Wager 콜백 (베팅 종료 및 지급)
   */
  async endWager(body: EndWagerRequestDto): Promise<EndWagerResponseDto> {
    try {
      const error = this.verifyAndValidate(
        body,
        ['brand_id', 'wager_id', 'round_id', 'amount', 'sign'],
        [body.wager_id],
      );
      if (error) return error;

      const session = await this.getSession(body);
      if (!session) return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);

      // [SECURITY FIX] 세션 소유 및 통화 검증
      if (session.playerName !== body.brand_uid) return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
      if (session.gameCurrency !== body.currency) return getDcsResponse(DcsResponseCode.REQUEST_PARAM_ERROR);

      const result = await this.processCasinoCreditService.execute({
        session,
        amount: new Prisma.Decimal(body.amount.toString()),
        transactionId: body.wager_id,
        roundId: body.round_id,
        gameId: session.gameId || BigInt(0),
        winTime: new Date(body.transaction_time),
        provider:
          this.dcsMapperService.fromDcsProvider(body.provider) ||
          GameProvider.PRAGMATIC_PLAY_SLOTS,
        isEndRound: body.is_endround,
        description: 'DCS End Wager',
      });

      return getDcsResponse(DcsResponseCode.SUCCESS, {
        balance: result.balance,
        brand_uid: session.playerName,
        currency: body.currency,
        wager_id: body.wager_id,
      });
    } catch (error) {
      return this.handleError(error, body.brand_uid, body.currency, body);
    }
  }

  /**
   * Free Spin Result 콜백
   */
  async freeSpinResult(
    body: FreeSpinResultRequestDto,
  ): Promise<FreeSpinResultResponseDto> {
    try {
      const error = this.verifyAndValidate(
        body,
        ['brand_id', 'wager_id', 'round_id', 'amount', 'sign'],
        [body.wager_id],
      );
      if (error) return error;

      const session = await this.getSession(body);
      if (!session) return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);

      // [SECURITY FIX] 세션 소유 및 통화 검증
      if (session.playerName !== body.brand_uid) return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
      if (session.gameCurrency !== body.currency) return getDcsResponse(DcsResponseCode.REQUEST_PARAM_ERROR);

      const result = await this.processCasinoCreditService.execute({
        session,
        amount: new Prisma.Decimal(body.amount.toString()),
        transactionId: body.wager_id,
        roundId: body.round_id,
        gameId: session.gameId || BigInt(body.game_id),
        winTime: new Date(body.transaction_time),
        provider:
          this.dcsMapperService.fromDcsProvider(body.provider) ||
          GameProvider.PRAGMATIC_PLAY_SLOTS,
        isBonus: true,
        isEndRound: body.is_endround,
        description: body.freespin_description || 'DCS FreeSpin Result',
      });

      return getDcsResponse(DcsResponseCode.SUCCESS, {
        balance: result.balance,
        brand_uid: session.playerName,
        currency: body.currency,
        wager_id: body.wager_id,
      });
    } catch (error) {
      return this.handleError(error, body.brand_uid, body.currency, body);
    }
  }

  /**
   * Get Balance 콜백
   */
  async getBalance(
    body: GetDcsBalanceRequestDto,
  ): Promise<GetDcsBalanceResponseDto> {
    try {
      // 1. 통합 검증 (필수값 + 서명)
      const error = this.verifyAndValidate(
        body,
        ['brand_id', 'sign', 'token', 'brand_uid', 'currency'],
        [body.token],
      );
      if (error) return error;

      // 2. 세션 조회 (토큰 우선, 없으면 플레이어네임 기준 최근 세션)
      let session =
        await this.findCasinoGameSessionService.findByToken(body.token);

      if (!session && /^\d+$/.test(body.brand_uid)) {
        session = await this.findCasinoGameSessionService.findRecent(
          BigInt(body.brand_uid),
          GameAggregatorType.DC,
        );
      }

      if (!session) {
        this.logger.warn(
          `DCS Balance API - Session not found: token=${body.token}, brand_uid=${body.brand_uid}`,
        );
        return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
      }

      // [SECURITY FIX] 세션 소유 및 통화 검증
      if (session.playerName !== body.brand_uid) return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
      if (session.gameCurrency !== body.currency) return getDcsResponse(DcsResponseCode.REQUEST_PARAM_ERROR);

      // 3. 잔액 서비스 호출
      const result = await this.checkCasinoBalanceService.execute(session);

      return getDcsResponse(DcsResponseCode.SUCCESS, {
        balance: result.balance,
        brand_uid: session.playerName,
        currency: body.currency,
      });
    } catch (error) {
      return this.handleError(error, body.brand_uid, body.currency, body);
    }
  }

  /**
   * Promo Payout 콜백 (프로모션 지급)
   */
  async promoPayout(
    body: PromoPayoutRequestDto,
  ): Promise<PromoPayoutResponseDto> {
    try {
      const error = this.verifyAndValidate(
        body,
        ['brand_id', 'trans_id', 'promotion_id', 'amount', 'sign'],
        [body.trans_id],
      );
      if (error) return error;

      const session = await this.getSession(body);
      if (!session) return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);

      // [SECURITY FIX] 세션 소유 및 통화 검증
      if (session.playerName !== body.brand_uid) return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
      if (session.gameCurrency !== body.currency) return getDcsResponse(DcsResponseCode.REQUEST_PARAM_ERROR);

      const result = await this.processCasinoCreditService.execute({
        session,
        amount: new Prisma.Decimal(body.amount.toString()),
        transactionId: body.trans_id,
        roundId: body.promotion_id, // Use promotion_id as round_id alternative
        gameId: BigInt(0),
        winTime: new Date(body.transaction_time),
        provider:
          this.dcsMapperService.fromDcsProvider(body.provider) ||
          GameProvider.PRAGMATIC_PLAY_SLOTS,
        isBonus: true,
        description: `DCS Promo Payout: ${body.promotion_id}`,
      });

      return getDcsResponse(DcsResponseCode.SUCCESS, {
        balance: result.balance,
        brand_uid: session.playerName,
        currency: body.currency,
        trans_id: body.trans_id,
      });
    } catch (error) {
      return this.handleError(error, body.brand_uid, body.currency, body);
    }
  }

  /**
   * DCS 특화 에러 핸들링
   */
  private async handleError(
    error: any,
    brand_uid: string,
    currency: string,
    requestBody?: any,
  ): Promise<any> {
    this.logger.error(`[DCS] Callback Error:`, error);

    // 잔액 조회가 필요한 에러 상황을 위해 현재 잔액 시도
    let currentBalance = new Prisma.Decimal(0);
    try {
      if (/^\d+$/.test(brand_uid)) {
        const session = await this.findCasinoGameSessionService.findRecent(
          BigInt(brand_uid),
          GameAggregatorType.DC,
        );
        if (session) {
          const balanceResult =
            await this.checkCasinoBalanceService.execute(session);
          currentBalance = balanceResult.balance;
        }
      }
    } catch (e) {
      // ignore balance lookup error during error handling
    }

    if (
      error instanceof InsufficientBalanceException ||
      error.message === CasinoErrorCode.INSUFFICIENT_FUNDS
    ) {
      return getDcsResponse(DcsResponseCode.BALANCE_INSUFFICIENT, {
        brand_uid,
        currency,
        balance: currentBalance,
      });
    }

    const dcsError = this.getDcsErrorFromMessage(error.message);

    // 시스템 로그 기록 (예상된 비즈니스 에러 외의 심각한 오류나 시스템 오류 위주)
    const isCritical = dcsError.code === DcsResponseCode.SYSTEM_ERROR ||
      !Object.values(CasinoErrorCode).includes(error.message as any);

    this.dispatchLogService.dispatch(
      {
        type: LogType.ERROR,
        data: {
          errorCode: `CASINO_DCS_${dcsError.code}`,
          errorMessage: `[DCS Callback] ${error.message || 'Unknown Error'}`,
          stackTrace: error.stack,
          severity: isCritical ? 'CRITICAL' : 'ERROR',
          metadata: {
            requestBody,
            brand_uid,
            currency,
            originalError: error.message,
          }
        },
      },
    ).catch((err) => this.logger.warn(`Failed to dispatch system log: ${err.message}`));

    return getDcsResponse(dcsError.code, {
      brand_uid,
      currency,
      balance: currentBalance,
    });
  }

  private getDcsErrorFromMessage(message: string): { code: DcsResponseCode } {
    switch (message) {
      case CasinoErrorCode.DUPLICATE_DEBIT:
      case CasinoErrorCode.DUPLICATE_CREDIT:
      case CasinoErrorCode.BONUS_ALREADY_PROCESSED:
        return { code: DcsResponseCode.BET_RECORD_DUPLICATE };
      case CasinoErrorCode.INVALID_USER:
      case CasinoErrorCode.USER_BALANCE_NOT_FOUND:
        return { code: DcsResponseCode.PLAYER_NOT_EXIST };
      case CasinoErrorCode.INVALID_TXN:
        return { code: DcsResponseCode.BET_RECORD_NOT_EXIST };
      default:
        return { code: DcsResponseCode.SYSTEM_ERROR };
    }
  }
}
