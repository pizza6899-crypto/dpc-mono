import { Injectable, Logger } from '@nestjs/common';
import { EnvService } from 'src/common/env/env.service';
import {
  GameAggregatorType,
} from '@prisma/client';
import { WhitecliffMapperService } from '../infrastructure/whitecliff-mapper.service';
import { getCasinoErrorCode } from '../utils/whitecliff-error-response.util';
import { CasinoErrorCode } from '../../../constants/casino-error-codes';
import { CheckCasinoBalanceService } from '../../../application/check-casino-balance.service';
import { FindCasinoGameSessionService } from '../../../game-session/application/find-casino-game-session.service';
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
    private readonly findCasinoGameSessionService: FindCasinoGameSessionService,
    private readonly checkCasinoBalanceService: CheckCasinoBalanceService,
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
      // 1. 세션 조회
      const session = sid ? await this.findCasinoGameSessionService.findByToken(sid) : null;

      if (!session || session.aggregatorType !== GameAggregatorType.WHITECLIFF) {
        this.logger.error(`❌ Balance API - 세션 존재하지 않음: sid=${sid}, user_id=${user_id}`);
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      // 2. user_id(whitecliffSystemId) 검증
      const user = await this.tx.user.findUnique({
        where: { id: session.userId },
        select: { whitecliffSystemId: true },
      });

      if (
        !user ||
        (user.whitecliffSystemId && Number(user.whitecliffSystemId) !== Number(user_id))
      ) {
        this.logger.error(
          `❌ Balance API - user_id 불일치: session_user_id=${user?.whitecliffSystemId}, request_user_id=${user_id}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      // 3. gameCurrency 검증
      if (currency && session.gameCurrency !== currency) {
        this.logger.error(
          `❌ Balance API - gameCurrency 불일치: session_currency=${session.gameCurrency}, request_currency=${currency}`,
        );
        throw new Error(CasinoErrorCode.INVALID_USER);
      }

      // 4. 잔액 서비스 호출
      const result = await this.checkCasinoBalanceService.execute(session);

      return {
        status: 1,
        balance: result.balance.toNumber(),
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
    throw new Error('Debit not implemented');
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
    throw new Error('Credit not implemented');
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
    throw new Error('Bonus not implemented');
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
