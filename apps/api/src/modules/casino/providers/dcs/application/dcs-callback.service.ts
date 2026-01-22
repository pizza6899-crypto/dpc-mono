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
  ) {
    this.dcsConfig = this.envService.dcs;
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
      return this.handleError(error, body.brand_uid, body.currency);
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
      const session =
        await this.findCasinoGameSessionService.findByToken(body.token);
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
      return this.handleError(error, body.brand_uid, body.currency);
    }
  }

  /**
   * Cancel Wager 콜백 (베팅 취소)
   */
  async cancelWager(
    body: CancelWagerRequestDto,
  ): Promise<CancelWagerResponseDto> {
    throw new Error('Cancel Wager not implemented');
  }

  /**
   * Append Wager 콜백 (추가 베팅)
   */
  async appendWager(
    body: AppendWagerRequestDto,
  ): Promise<AppendWagerResponseDto> {
    throw new Error('Append Wager not implemented');
  }

  /**
   * End Wager 콜백 (베팅 종료 및 지급)
   */
  async endWager(body: EndWagerRequestDto): Promise<EndWagerResponseDto> {
    throw new Error('End Wager not implemented');
  }

  /**
   * Free Spin Result 콜백
   */
  async freeSpinResult(
    body: FreeSpinResultRequestDto,
  ): Promise<FreeSpinResultResponseDto> {
    throw new Error('Free Spin Result not implemented');
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
      return this.handleError(error, body.brand_uid, body.currency);
    }
  }

  /**
   * Promo Payout 콜백 (프로모션 지급)
   */
  async promoPayout(
    body: PromoPayoutRequestDto,
  ): Promise<PromoPayoutResponseDto> {
    throw new Error('Promo Payout not implemented');
  }

  /**
   * DCS 특화 에러 핸들링
   */
  private async handleError(
    error: any,
    brand_uid: string,
    currency: string,
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

    switch (error.message) {
      case CasinoErrorCode.DUPLICATE_DEBIT:
      case CasinoErrorCode.DUPLICATE_CREDIT:
      case CasinoErrorCode.BONUS_ALREADY_PROCESSED:
        return getDcsResponse(DcsResponseCode.BET_RECORD_DUPLICATE, {
          brand_uid,
          currency,
          balance: currentBalance,
        });
      case CasinoErrorCode.INVALID_USER:
      case CasinoErrorCode.USER_BALANCE_NOT_FOUND:
        return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
      case CasinoErrorCode.INVALID_TXN:
        return getDcsResponse(DcsResponseCode.BET_RECORD_NOT_EXIST, {
          brand_uid,
          currency,
          balance: currentBalance,
        });
      default:
        return getDcsResponse(DcsResponseCode.SYSTEM_ERROR);
    }
  }
}
