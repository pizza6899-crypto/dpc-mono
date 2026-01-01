// src/modules/casino-refactor/aggregator/wc/application/wc-callback.service.ts
import { Injectable } from '@nestjs/common';
import { WhitecliffCallbackService } from 'src/modules/casino/whitecliff/application/whitecliff-callback.service';
import {
  GetWhitecliffBalanceRequestDto,
  GetWhitecliffBalanceResponseDto,
  DebitRequestDto,
  CreditRequestDto,
  TransactionResponseDto,
  GetBonusRequestDto,
  GetBonusResponseDto,
} from 'src/modules/casino/whitecliff/dtos';
import { GamingCurrencyCode } from 'src/utils/currency.util';

/**
 * WC (Whitecliff) 콜백 서비스
 * 기존 WhitecliffCallbackService를 래핑하여 사용
 */
@Injectable()
export class WcCallbackService {
  constructor(
    private readonly whitecliffCallbackService: WhitecliffCallbackService,
  ) {}

  /**
   * 사용자 잔액 조회
   */
  async getBalance(
    body: GetWhitecliffBalanceRequestDto,
    gameCurrency: GamingCurrencyCode,
  ): Promise<GetWhitecliffBalanceResponseDto> {
    return this.whitecliffCallbackService.getBalance(body, gameCurrency);
  }

  /**
   * 사용자 잔액 차감
   */
  async debit(
    body: DebitRequestDto,
    gameCurrency: GamingCurrencyCode,
  ): Promise<TransactionResponseDto> {
    return this.whitecliffCallbackService.debit(body, gameCurrency);
  }

  /**
   * 사용자 잔액 추가
   */
  async credit(
    body: CreditRequestDto,
    gameCurrency: GamingCurrencyCode,
  ): Promise<TransactionResponseDto> {
    return this.whitecliffCallbackService.credit(body, gameCurrency);
  }

  /**
   * 사용자 보너스 조회
   */
  async getBonus(
    body: GetBonusRequestDto,
    gameCurrency: GamingCurrencyCode,
  ): Promise<GetBonusResponseDto> {
    return this.whitecliffCallbackService.getBonus(body, gameCurrency);
  }

  /**
   * 비밀키 검증
   */
  validateSecretKey(secretKey: string) {
    return this.whitecliffCallbackService.validateSecretKey(secretKey);
  }
}

