import { Injectable, Logger } from '@nestjs/common';
import { EnvService } from 'src/common/env/env.service';
import {
  GameAggregatorType,
  Prisma,
} from '@prisma/client';
import { WhitecliffMapperService } from '../infrastructure/whitecliff-mapper.service';
import { getCasinoErrorCode } from '../utils/whitecliff-error-response.util';
import { CasinoErrorCode } from '../../../constants/casino-error-codes';
import { CheckCasinoBalanceService } from '../../../application/check-casino-balance.service';
import { FindCasinoGameSessionService } from '../../../game-session/application/find-casino-game-session.service';
import { ProcessCasinoBetService } from '../../../application/process-casino-bet.service';
import { type GamingCurrencyCode } from 'src/utils/currency.util';
import { CreditRequestDto, DebitRequestDto, GetBonusRequestDto, GetBonusResponseDto, GetWhitecliffBalanceRequestDto, GetWhitecliffBalanceResponseDto, TransactionResponseDto } from '../dtos';

@Injectable()
export class WhitecliffCallbackService {
  private readonly logger = new Logger(WhitecliffCallbackService.name);

  constructor(
    private readonly envService: EnvService,
    private readonly whitecliffMapperService: WhitecliffMapperService,
    private readonly findCasinoGameSessionService: FindCasinoGameSessionService,
    private readonly checkCasinoBalanceService: CheckCasinoBalanceService,
    private readonly processCasinoBetService: ProcessCasinoBetService,
  ) { }

  /**
   * 사용자 잔액 조회
   * @param userId 사용자 ID
   * @param prdId 제품 ID
   * @param sid 세션 ID
   * @returns 사용자 잔액 정보
   */
  /**
   * 통합 검증 헬퍼
   */
  private verifyRequest(body: any, requiredFields: string[], secretKey: string): { currency: GamingCurrencyCode } | { error: any } {
    // 1. 필수 필드 검증
    try {
      this.validateRequiredFields(body, requiredFields);
    } catch (e) {
      return {
        error: {
          status: 0,
          balance: 0,
          error: 'UNKNOWN_ERROR', // 파라미터 누락은 포괄적 에러로 처리하거나 문서상 규격 확인 필요
        }
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
        }
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

    // 1. 통합 검증
    const verification = this.verifyRequest(body, ['user_id'], secretKey);
    if ('error' in verification) return verification.error;
    const { currency } = verification;

    try {
      // 2. 세션 조회 (Priority 1: SID, Priority 2: user_id)
      let session = sid ? await this.findCasinoGameSessionService.findByToken(sid) : null;

      if (!session && user_id) {
        // Fallback: user_id(whitecliffSystemId)로 최근 세션 조회
        // 주의: user_id가 number 타입이므로 BigInt 변환 필요
        session = await this.findCasinoGameSessionService.findRecent(
          BigInt(user_id),
          GameAggregatorType.WHITECLIFF
        );
      }

      if (!session || session.aggregatorType !== GameAggregatorType.WHITECLIFF) {
        this.logger.error(`❌ Balance API - 세션 존재하지 않음: sid=${sid}, user_id=${user_id}`);
        // WC 문서는 INVALID_USER를 리턴하라고 함
        return {
          status: 0,
          balance: 0,
          error: 'INVALID_USER',
        };
      }

      // 3. user_id 검증 (세션의 유저와 요청 유저가 일치하는지)
      // findRecent로 찾은 경우는 이미 일치하겠지만, sid로 찾은 경우는 검증 필요
      if (sid && session.playerName !== String(user_id)) {
        this.logger.error(`❌ Balance API - user_id 불일치: sessionPlayerName=${session.playerName}, req=${user_id}`);
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }

      // 4. Currency 검증
      if (currency && session.gameCurrency !== currency) {
        this.logger.warn(`⚠️ Balance API - Currency Mismatch (Session: ${session.gameCurrency}, Config: ${currency}). Proceeding with Session Currency.`);
      }

      // 5. 잔액 서비스 호출
      const result = await this.checkCasinoBalanceService.execute(session);

      return {
        status: 1,
        balance: result.balance.toNumber(),
      };
    } catch (error) {
      return this.handleError(error, user_id, currency || 'UNKNOWN');
    }
  }

  /**
   * 사용자 잔액 차감 (Betting)
   */
  async debit(
    body: DebitRequestDto,
    secretKey: string,
  ): Promise<TransactionResponseDto> {
    const verification = this.verifyRequest(body, ['user_id', 'amount', 'txn_id'], secretKey);
    if ('error' in verification) return verification.error;
    const { currency } = verification;

    try {
      const { user_id, sid, amount, txn_id, round_id, game_id, debit_time, prd_id, desc } = body;

      // 1. 세션 조회
      let session = sid ? await this.findCasinoGameSessionService.findByToken(sid) : null;

      if (!session && user_id) {
        session = await this.findCasinoGameSessionService.findRecent(BigInt(user_id), GameAggregatorType.WHITECLIFF);
      }

      if (!session || session.aggregatorType !== GameAggregatorType.WHITECLIFF) {
        this.logger.error(`❌ Debit API - Session Not Found: sid=${sid}, user_id=${user_id}`);
        return { status: 0, balance: 0, error: 'INVALID_USER' };
      }

      // 2. Bet Time 파싱
      const betTime = debit_time ? new Date(debit_time) : new Date();
      if (debit_time && isNaN(betTime.getTime())) {
        this.logger.warn(`Invalid debit_time: ${debit_time}, using current time.`);
      }

      // 3. Provider 매핑
      const provider = prd_id
        ? this.whitecliffMapperService.fromWhitecliffProvider(prd_id)
        : null;

      // 4. 베팅 처리 서비스 호출
      const result = await this.processCasinoBetService.execute({
        session: session,
        amount: new Prisma.Decimal(amount),
        transactionId: txn_id,
        roundId: round_id || txn_id, // fallback to txn_id if round_id is missing
        gameId: BigInt(game_id || 0),
        betTime: isNaN(betTime.getTime()) ? new Date() : betTime,
        provider: provider || GameAggregatorType.WHITECLIFF as any, // Fallback if mapping fails, or use a default
        description: desc ? JSON.stringify(desc) : 'Whitecliff Bet',
      });

      return {
        status: 1,
        balance: result.balance.toNumber(),
      };

    } catch (error) {
      return this.handleError(error, body.user_id, currency || 'UNKNOWN');
    }
  }

  /**
   * 사용자 잔액 추가
   */
  async credit(
    body: CreditRequestDto,
    secretKey: string,
  ): Promise<TransactionResponseDto> {
    const verification = this.verifyRequest(body, ['user_id', 'amount', 'txn_id'], secretKey);
    if ('error' in verification) return verification.error;

    throw new Error('Credit not implemented');
  }

  /**
   * 사용자 보너스 조회
   */
  async getBonus(
    body: GetBonusRequestDto,
    secretKey: string,
  ): Promise<GetBonusResponseDto> {
    const verification = this.verifyRequest(body, ['user_id'], secretKey);
    if ('error' in verification) return verification.error;

    throw new Error('Bonus not implemented');
  }

  /**
   * 비밀키 검증
   */
  validateSecretKey(secretKey: string) {
    const config = this.envService.whitecliff.find(
      (config) => config.secretKey === secretKey,
    );

    if (!config) {
      return {
        isValid: false,
        currency: null,
      };
    }

    const currency =
      this.whitecliffMapperService.convertWhitecliffCurrencyToGamingCurrency(
        config.currency,
      );

    return {
      isValid: true,
      currency: currency,
    };
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
    userId: number | string, // whitecliffSystemId
    currency: string,
  ): Promise<any> {
    this.logger.error(`[Whitecliff] Error for user ${userId}:`, error);

    // 에러 발생 시 현재 잔액 조회 시도 (잔액 부족 등의 경우 최신 잔액 반환 필요 시)
    let currentBalance = 0;
    try {
      if (userId) {
        const session = await this.findCasinoGameSessionService.findRecent(BigInt(userId), GameAggregatorType.WHITECLIFF);
        if (session) {
          const res = await this.checkCasinoBalanceService.execute(session);
          currentBalance = res.balance.toNumber();
        }
      }
    } catch (e) { }

    const errorCode = getCasinoErrorCode(error);

    switch (errorCode) {
      case CasinoErrorCode.INSUFFICIENT_FUNDS:
        return {
          status: 0,
          balance: currentBalance,
          error: 'INSUFFICIENT_FUNDS',
        };
      case CasinoErrorCode.INVALID_USER:
      case CasinoErrorCode.USER_BALANCE_NOT_FOUND:
        return {
          status: 0,
          balance: 0,
          error: 'INVALID_USER',
        };
      case CasinoErrorCode.DUPLICATE_DEBIT:
        // 이미 처리된 트랜잭션은 성공으로 간주하거나, 에러로 내려주되 잔액 갱신
        // Whitecliff 문서를 봐야 정확하나 보통 성공(1)으로 처리하고 현재 잔액 리턴하는 경우도 많음
        // 여기서는 에러 메시지를 주되 잔액을 포함
        return {
          status: 0, // 혹은 1? 문서 확인 필요. 안전하게 0+메시지로 감.
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
        return {
          status: 0,
          balance: currentBalance,
          error: 'UNKNOWN_ERROR',
        };
    }
  }
}
