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

  /**
   * 세션 조회 헬퍼
   */
  private async getSession(body: any): Promise<any> {
    if (body.token) {
      const session = await this.findCasinoGameSessionService.findByToken(
        body.token,
      );
      if (session) return session;
    }

    // token으로 못 찾거나 없는 경우 brand_uid(user id)로 시도
    if (body.brand_uid && /^\d+$/.test(body.brand_uid)) {
      return await this.findCasinoGameSessionService.findRecent(
        BigInt(body.brand_uid),
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
        amount: new Prisma.Decimal(body.amount),
        transactionId: body.wager_id,
        roundId: body.round_id,
        gameId: BigInt(body.game_id),
        betTime: isNaN(betTime.getTime()) ? new Date() : betTime,
        provider: provider,
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

      if (body.wager_type === 1) {
        // Cancel Wager (Refund)

        /**
         * TODO: [Refactoring] 리포지토리 직접 접근 및 환불 로직 분리
         * 현재는 구현 편의상 Controller/Service 레이어에서 Repository를 직접 호출하여
         * 라운드를 조회하고 환불 금액을 계산하고 있습니다.
         * 
         * 추후 다른 프로바이더에서도 유사한 '조회 후 전액 환불' 로직이 반복된다면,
         * 이를 `ProcessCasinoRefundService`와 같은 별도 Domain Service로 분리하여
         * 비즈니스 로직(환불 정책, 검증)을 캡슐화하는 것이 좋습니다.
         */

        // round_id와 시간 윈도우로 라운드 조회
        // 시간 정보가 요청에 없으면 현재 시간 기준으로 조회하거나, 시간 무관하게 검색해야 할 수도 있음.
        // 여기서는 일단 transaction_time이 있다고 가정하거나(문서에 따름), 없으면 현재 시간 기준 하루 전까지 검색.
        const referenceTime = body.transaction_time
          ? new Date(body.transaction_time)
          : new Date();

        const round =
          await this.gameRoundRepository.findByExternalIdWithWindow(
            body.round_id,
            GameAggregatorType.DC,
            referenceTime, // 검색 기준 시간
            24, // 24시간 윈도우
          );

        // 라운드가 없으면 이미 취소되었거나 존재하지 않는 것으로 간주하고 성공 응답 (Idempotency)
        if (!round) {
          const balanceResult =
            await this.checkCasinoBalanceService.execute(session);
          return getDcsResponse(DcsResponseCode.SUCCESS, {
            balance: balanceResult.balance,
            brand_uid: session.playerName,
            currency: body.currency,
            wager_id: body.wager_id,
          });
        }

        // 환불 금액: 전체 베팅 금액 (부분 취소 불가 가정)
        // TODO: 이미 부분 환불된 경우 잔여 금액만 환불해야 하는지 확인 필요.
        // 현재는 전체 환불 로직.
        const refundAmount = round.totalGameBetAmount;

        if (refundAmount.lte(0)) {
          const balanceResult =
            await this.checkCasinoBalanceService.execute(session);
          return getDcsResponse(DcsResponseCode.SUCCESS, {
            balance: balanceResult.balance,
            brand_uid: session.playerName,
            currency: body.currency,
            wager_id: body.wager_id,
          });
        }

        const result = await this.processCasinoCreditService.execute({
          session,
          amount: refundAmount,
          transactionId: body.wager_id,
          roundId: body.round_id,
          gameId: round.gameId,
          winTime: body.transaction_time
            ? new Date(body.transaction_time)
            : new Date(),
          provider:
            this.dcsMapperService.fromDcsProvider(body.provider) ||
            GameProvider.PRAGMATIC_PLAY_SLOTS,
          isCancel: true,
          description: 'DCS Cancel Wager',
        });

        return getDcsResponse(DcsResponseCode.SUCCESS, {
          balance: result.balance,
          brand_uid: session.playerName,
          currency: body.currency,
          wager_id: body.wager_id,
        });
      } else {
        this.logger.warn(
          `Unsupported wager_type for cancelWager: ${body.wager_type}`,
        );
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

      // 추가 베팅 처리
      const result = await this.processCasinoBetService.execute({
        session: session,
        amount: new Prisma.Decimal(body.amount),
        transactionId: body.wager_id,
        roundId: body.round_id, // 기존 라운드 ID 사용
        gameId: BigInt(body.game_id),
        betTime: new Date(), // AppendWager에는 transaction_time이 DcsTransactionBaseDto에 포함됨 (body.transaction_time 사용 가능)
        provider:
          this.dcsMapperService.fromDcsProvider(body.provider) ||
          GameProvider.PRAGMATIC_PLAY_SLOTS,
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

      const result = await this.processCasinoCreditService.execute({
        session,
        amount: new Prisma.Decimal(body.amount),
        transactionId: body.wager_id,
        roundId: body.round_id,
        gameId: BigInt(0), // Round lookup will handle proper gameId if round exists
        winTime: new Date(body.transaction_time),
        provider:
          this.dcsMapperService.fromDcsProvider(body.provider) ||
          GameProvider.PRAGMATIC_PLAY_SLOTS,
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

      const result = await this.processCasinoCreditService.execute({
        session,
        amount: new Prisma.Decimal(body.amount),
        transactionId: body.wager_id,
        roundId: body.round_id,
        gameId: BigInt(body.game_id),
        winTime: new Date(body.transaction_time),
        provider:
          this.dcsMapperService.fromDcsProvider(body.provider) ||
          GameProvider.PRAGMATIC_PLAY_SLOTS,
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

      const result = await this.processCasinoCreditService.execute({
        session,
        amount: new Prisma.Decimal(body.amount),
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
