import { Injectable, Logger } from '@nestjs/common';
import { EnvService } from 'src/common/env/env.service';
import { GameAggregatorType, Prisma, GameProvider } from '@prisma/client';
import { WhitecliffMapperService } from '../infrastructure/whitecliff-mapper.service';
import { getCasinoErrorCode } from '../utils/whitecliff-error-response.util';
import { CasinoErrorCode } from 'src/modules/casino/constants/casino-error-codes';
import { CheckCasinoBalanceService } from 'src/modules/casino/application/check-casino-balance.service';
import { FindCasinoGameSessionService } from 'src/modules/casino-session/application/find-casino-game-session.service';
import { ProcessCasinoBetService } from 'src/modules/casino/application/process-casino-bet.service';
import { ProcessCasinoCreditService } from 'src/modules/casino/application/process-casino-credit.service';
import { type GamingCurrencyCode } from 'src/utils/currency.util';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import {
  BonusRequestDto,
  BonusResponseDto,
  CreditRequestDto,
  DebitRequestDto,
  GetWhitecliffBalanceRequestDto,
  GetWhitecliffBalanceResponseDto,
  TransactionResponseDto,
} from '../dtos';

@Injectable()
export class WhitecliffCallbackService {
  private readonly logger = new Logger(WhitecliffCallbackService.name);

  constructor(
    private readonly envService: EnvService,
    private readonly whitecliffMapperService: WhitecliffMapperService,
    private readonly findCasinoGameSessionService: FindCasinoGameSessionService,
    private readonly checkCasinoBalanceService: CheckCasinoBalanceService,
    private readonly processCasinoBetService: ProcessCasinoBetService,
    private readonly processCasinoCreditService: ProcessCasinoCreditService,
    private readonly dispatchLogService: DispatchLogService,
  ) { }

  /**
   * 통합 검증 헬퍼
   */
  private verifyRequest(
    body: any,
    requiredFields: string[],
    secretKey: string,
  ): { currency: GamingCurrencyCode } | { error: any } {
    // 1. 필수 필드 검증
    try {
      this.validateRequiredFields(body, requiredFields);
    } catch (e) {
      return {
        error: {
          status: 0,
          balance: 0,
          error: 'UNKNOWN_ERROR',
        },
      };
    }

    // 2. Secret Key 검증
    const { isValid, currency } = this.validateSecretKey(secretKey);
    if (!isValid) {
      return {
        error: {
          status: 0,
          balance: 0,
          error: 'ACCESS_DENIED',
        },
      };
    }

    return { currency: currency as GamingCurrencyCode };
  }

  /**
   * 사용자 잔액 조회
   */
  async getBalance(
    body: GetWhitecliffBalanceRequestDto,
    secretKey: string,
  ): Promise<GetWhitecliffBalanceResponseDto> {
    const { user_id, sid } = body;

    const verification = this.verifyRequest(body, ['user_id'], secretKey);
    if ('error' in verification) return verification.error;
    const { currency } = verification;

    try {
      let session = sid
        ? await this.findCasinoGameSessionService.findByToken(sid)
        : null;

      if (!session && user_id) {
        session = await this.findCasinoGameSessionService.findRecent(
          BigInt(user_id),
          GameAggregatorType.WHITECLIFF,
        );
      }

      if (
        !session ||
        session.aggregatorType !== GameAggregatorType.WHITECLIFF
      ) {
        this.logger.error(
          `❌ Balance API - 세션 존재하지 않음: sid=${sid}, user_id=${user_id}`,
        );
        return {
          status: 0,
          balance: 0,
          error: 'INVALID_USER',
        };
      }

      if (session.playerName !== String(user_id)) {
        this.logger.error(
          `❌ Balance API - user_id 불일치: sessionPlayerName=${session.playerName}, req=${user_id}`,
        );
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }

      if (session.gameCurrency !== currency) {
        this.logger.error(
          `❌ Balance API - 통화 불일치: sessionCurrency=${session.gameCurrency}, reqCurrency=${currency}`,
        );
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }

      const result = await this.checkCasinoBalanceService.execute(session);

      return {
        status: 1,
        balance: result.balance.toNumber(),
      };
    } catch (error) {
      return this.handleError(error, user_id, currency || 'UNKNOWN', body);
    }
  }

  /**
   * 사용자 잔액 차감 (Betting)
   */
  async debit(
    body: DebitRequestDto,
    secretKey: string,
  ): Promise<TransactionResponseDto> {
    const verification = this.verifyRequest(
      body,
      ['user_id', 'amount', 'txn_id'],
      secretKey,
    );
    if ('error' in verification) return verification.error;
    const { currency } = verification;

    try {
      const {
        user_id,
        sid,
        amount,
        txn_id,
        round_id,
        game_id,
        debit_time,
        prd_id,
        desc,
      } = body;

      let session = sid
        ? await this.findCasinoGameSessionService.findByToken(sid)
        : null;
      if (!session && user_id) {
        session = await this.findCasinoGameSessionService.findRecent(
          BigInt(user_id),
          GameAggregatorType.WHITECLIFF,
        );
      }

      if (
        !session ||
        session.aggregatorType !== GameAggregatorType.WHITECLIFF
      ) {
        this.logger.error(
          `❌ Debit API - Session Not Found: sid=${sid}, user_id=${user_id}`,
        );
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }

      // [SECURITY FIX] 세션 소유 및 통화 검증
      if (session.playerName !== String(user_id)) {
        this.logger.error(
          `❌ Debit API - user_id 불일치: SessionUser=${session.playerName}, ReqUser=${user_id}`,
        );
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }
      if (session.gameCurrency !== currency) {
        this.logger.error(
          `❌ Debit API - 통화 불일치: SessionCurr=${session.gameCurrency}, VerificationReqCurr=${currency}`,
        );
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }

      const betTime = debit_time ? new Date(debit_time) : new Date();
      const provider = prd_id
        ? this.whitecliffMapperService.fromWhitecliffProvider(prd_id)
        : GameProvider.PRAGMATIC_PLAY_SLOTS;

      const result = await this.processCasinoBetService.execute({
        session: session,
        amount: new Prisma.Decimal(amount.toString()),
        transactionId: txn_id,
        roundId: round_id || txn_id,
        gameId: BigInt(game_id || 0),
        betTime: isNaN(betTime.getTime()) ? new Date() : betTime,
        provider: provider!, // Default fallback applied above
        description: desc ? JSON.stringify(desc) : 'Whitecliff Bet',
      });

      // credit_amount가 포함된 경우 추가적인 당첨 지급 처리
      let finalBalance = result.balance;
      if (body.credit_amount && body.credit_amount > 0) {
        const winResult = await this.processCasinoCreditService.execute({
          session: session,
          amount: new Prisma.Decimal(body.credit_amount),
          transactionId: `${txn_id}_WIN`, // 겹치지 않게 가공
          roundId: round_id || txn_id,
          gameId: BigInt(game_id || 0),
          winTime: betTime,
          provider: provider!,
          description: 'Whitecliff Debit-Credit Auto Win',
        });
        finalBalance = winResult.balance;
      }

      return {
        status: 1,
        balance: finalBalance.toNumber(),
      };
    } catch (error) {
      return this.handleError(error, body.user_id, currency || 'UNKNOWN', body);
    }
  }

  /**
   * 사용자 잔액 추가 (Win / Refund)
   */
  async credit(
    body: CreditRequestDto,
    secretKey: string,
  ): Promise<TransactionResponseDto> {
    const verification = this.verifyRequest(
      body,
      ['user_id', 'amount', 'txn_id'],
      secretKey,
    );
    if ('error' in verification) return verification.error;
    const { currency } = verification;

    try {
      const {
        user_id,
        sid,
        amount,
        txn_id,
        round_id,
        game_id,
        credit_time,
        prd_id,
        is_cancel,
        desc,
      } = body;

      let session = sid
        ? await this.findCasinoGameSessionService.findByToken(sid)
        : null;
      if (!session && user_id) {
        session = await this.findCasinoGameSessionService.findRecent(
          BigInt(user_id),
          GameAggregatorType.WHITECLIFF,
        );
      }

      if (!session) {
        this.logger.error(
          `❌ Credit API - Session Not Found: sid=${sid}, user_id=${user_id}`,
        );
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }

      // [SECURITY FIX] 세션 소유 및 통화 검증
      if (session.playerName !== String(user_id)) {
        this.logger.error(
          `❌ Credit API - user_id 불일치: SessionUser=${session.playerName}, ReqUser=${user_id}`,
        );
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }
      if (session.gameCurrency !== currency) {
        this.logger.error(
          `❌ Credit API - 통화 불일치: SessionCurr=${session.gameCurrency}, VerificationReqCurr=${currency}`,
        );
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }

      const winTime = credit_time ? new Date(credit_time) : new Date();
      const provider = prd_id
        ? this.whitecliffMapperService.fromWhitecliffProvider(prd_id)
        : GameProvider.PRAGMATIC_PLAY_SLOTS;

      const result = await this.processCasinoCreditService.execute({
        session: session,
        amount: new Prisma.Decimal(amount.toString()),
        transactionId: txn_id,
        roundId: round_id || txn_id,
        gameId: BigInt(game_id || 0),
        winTime: isNaN(winTime.getTime()) ? new Date() : winTime,
        provider: provider!,
        isCancel: is_cancel === 1,
        description: desc
          ? JSON.stringify(desc)
          : is_cancel === 1
            ? 'Whitecliff Refund'
            : 'Whitecliff Win',
      });

      return {
        status: 1,
        balance: result.balance.toNumber(),
      };
    } catch (error) {
      return this.handleError(error, body.user_id, currency || 'UNKNOWN', body);
    }
  }

  /**
   * 사용자 보너스/잭팟 지급
   */
  async bonus(
    body: BonusRequestDto,
    secretKey: string,
  ): Promise<BonusResponseDto> {
    const verification = this.verifyRequest(
      body,
      ['user_id', 'amount', 'txn_id', 'type'],
      secretKey,
    );
    if ('error' in verification) return verification.error;
    const { currency } = verification;

    try {
      const { user_id, sid, amount, txn_id, round_id, game_id, prd_id, type } =
        body;

      let session = sid
        ? await this.findCasinoGameSessionService.findByToken(sid)
        : null;
      if (!session && user_id) {
        session = await this.findCasinoGameSessionService.findRecent(
          BigInt(user_id),
          GameAggregatorType.WHITECLIFF,
        );
      }

      if (!session) {
        this.logger.error(
          `❌ Bonus API - Session Not Found: sid=${sid}, user_id=${user_id}`,
        );
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }

      // [SECURITY FIX] 세션 소유 및 통화 검증
      if (session.playerName !== String(user_id)) {
        this.logger.error(
          `❌ Bonus API - user_id 불일치: SessionUser=${session.playerName}, ReqUser=${user_id}`,
        );
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }
      if (session.gameCurrency !== currency) {
        this.logger.error(
          `❌ Bonus API - 통화 불일치: SessionCurr=${session.gameCurrency}, VerificationReqCurr=${currency}`,
        );
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }

      const provider = prd_id
        ? this.whitecliffMapperService.fromWhitecliffProvider(prd_id)
        : GameProvider.PRAGMATIC_PLAY_SLOTS;

      const result = await this.processCasinoCreditService.execute({
        session: session,
        amount: new Prisma.Decimal(amount.toString()),
        transactionId: txn_id,
        roundId: round_id || txn_id,
        gameId: BigInt(game_id || 0),
        winTime: new Date(),
        provider: provider!,
        isBonus: type === 0 || type === 1,
        isJackpot: type === 2,
        description: type === 2 ? 'Whitecliff Jackpot' : 'Whitecliff Bonus',
      });

      return {
        status: 1,
        balance: result.balance.toNumber(),
      };
    } catch (error) {
      const errRes = await this.handleError(
        error,
        body.user_id,
        currency || 'UNKNOWN',
        body,
      );
      return {
        status: 0,
        balance: errRes.balance || 0,
        error: errRes.error || 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * 비밀키 검증
   */
  validateSecretKey(secretKey: string) {
    const config = this.envService.whitecliff.find(
      (config) => config.secretKey === secretKey,
    );

    if (!config) {
      return { isValid: false, currency: null };
    }

    const currency =
      this.whitecliffMapperService.convertWhitecliffCurrencyToGamingCurrency(
        config.currency,
      );

    return { isValid: true, currency: currency };
  }

  /**
   * 필수 파라미터 검증
   */
  private validateRequiredFields(body: any, fields: string[]) {
    for (const field of fields) {
      if (body[field] === undefined || body[field] === null) {
        this.logger.error(`❌ 파라미터 누락: ${field}`);
        throw new Error(CasinoErrorCode.PARAMETER_MISSING);
      }
    }
  }

  /**
   * 공통 에러 핸들링
   */
  private async handleError(
    error: any,
    userId: number | string,
    currency: string,
    requestBody?: any,
  ): Promise<any> {
    this.logger.error(`[Whitecliff] Error for user ${userId}:`, error);

    let currentBalance = 0;
    try {
      if (userId) {
        const session = await this.findCasinoGameSessionService.findRecent(
          BigInt(userId),
          GameAggregatorType.WHITECLIFF,
        );
        if (session) {
          const res = await this.checkCasinoBalanceService.execute(session);
          currentBalance = res.balance.toNumber();
        }
      }
    } catch (e) { }

    const errorCode = getCasinoErrorCode(error);

    // 시스템 로그 기록 (예상된 비즈니스 에러 외의 심각한 오류나 시스템 오류 위주)
    const isCritical =
      errorCode === CasinoErrorCode.UNKNOWN_ERROR ||
      !Object.values(CasinoErrorCode).includes(errorCode as any);

    this.dispatchLogService
      .dispatch({
        type: LogType.ERROR,
        data: {
          errorCode: `CASINO_WHITECLIFF_${errorCode}`,
          errorMessage: `[Whitecliff Callback] ${error.message || 'Unknown Error'}`,
          stackTrace: error.stack,
          severity: isCritical ? 'CRITICAL' : 'ERROR',
          metadata: {
            requestBody,
            userId,
            currency,
          },
        },
      })
      .catch((err) =>
        this.logger.warn(`Failed to dispatch system log: ${err.message}`),
      );

    switch (errorCode) {
      case CasinoErrorCode.INSUFFICIENT_FUNDS:
        return {
          status: 0,
          balance: currentBalance,
          error: 'INSUFFICIENT_FUNDS',
        };
      case CasinoErrorCode.INVALID_USER:
      case CasinoErrorCode.USER_BALANCE_NOT_FOUND:
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      case CasinoErrorCode.DUPLICATE_DEBIT:
        return {
          status: 0,
          balance: currentBalance,
          error: 'DUPLICATE_TRANSACTION',
        };
      case CasinoErrorCode.INVALID_TXN:
        return {
          status: 0,
          balance: currentBalance,
          error: 'TRANSACTION_NOT_FOUND',
        };
      default:
        return { status: 0, balance: currentBalance, error: 'UNKNOWN_ERROR' };
    }
  }
}
