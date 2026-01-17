// src/modules/exchange/application/exchange-rate-validator.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from 'src/generated/prisma';

export interface ExchangeRateValidationResult {
  isValid: boolean;
  changeRate?: Prisma.Decimal;
  reason?: string;
}

@Injectable()
export class ExchangeRateValidator {
  private readonly logger = new Logger(ExchangeRateValidator.name);

  private readonly GLOBAL_MAX_RATE = new Prisma.Decimal('100000000000000'); // 100조 (BTC-VND 고려)
  private readonly GLOBAL_MIN_RATE = new Prisma.Decimal('0.000000000001'); // 소수점 12자리 (Satoshi 미만 고려)
  private readonly STABLE_MAX_CHANGE_RATE = new Prisma.Decimal('0.1'); // 법정화폐 10%

  /**
   * 환율 검증
   * @param newRate 새로운 환율
   * @param previousRate 이전 환율 (선택적)
   * @param baseCurrency 기준 통화 (로깅용)
   * @param quoteCurrency 대상 통화 (로깅용)
   * @returns 검증 결과
   */
  validate(
    newRate: Prisma.Decimal,
    previousRate?: Prisma.Decimal,
    baseCurrency?: ExchangeCurrencyCode,
    quoteCurrency?: ExchangeCurrencyCode,
  ): ExchangeRateValidationResult {
    // 기본 검증: 0보다 크고 유한한 값인지 확인
    if (newRate.lte(0) || !newRate.isFinite()) {
      return {
        isValid: false,
        reason: 'Exchange rate must be greater than 0 and finite',
      };
    }

    // 극단적 값 검증: 허용 범위를 벗어나는지 확인
    if (newRate.gt(this.GLOBAL_MAX_RATE) || newRate.lt(this.GLOBAL_MIN_RATE)) {
      return {
        isValid: false,
        reason: `Exchange rate ${newRate.toString()} is outside acceptable range (${this.GLOBAL_MIN_RATE.toString()} ~ ${this.GLOBAL_MAX_RATE.toString()})`,
      };
    }

    // 이전 환율이 있는 경우 변동률 검증
    if (previousRate !== undefined && previousRate !== null) {
      // 이전 환율도 유효한 값인지 확인
      if (previousRate.lte(0) || !previousRate.isFinite()) {
        this.logger.warn(
          `이전 환율이 유효하지 않음: ${baseCurrency} → ${quoteCurrency}, previousRate: ${previousRate}`,
        );
        // 이전 환율이 유효하지 않아도 새 환율 자체는 유효할 수 있음
        return {
          isValid: true,
        };
      }

      const changeRate = newRate.sub(previousRate).abs().div(previousRate);

      if (changeRate.gte(this.STABLE_MAX_CHANGE_RATE)) {
        this.logger.warn(
          `환율 급격한 변동 감지: ${baseCurrency} → ${quoteCurrency}, ` +
          `이전: ${previousRate}, 현재: ${newRate}, 변동률: ${changeRate.toString()}`,
        );
        return {
          isValid: false,
          changeRate: changeRate,
          reason: `Exchange rate changed by ${changeRate.toFixed(2)}% (max: ${this.STABLE_MAX_CHANGE_RATE.toFixed(
            2,
          )}%)`,
        };
      }

      // 변동률이 허용 범위 내인 경우
      return {
        isValid: true,
        changeRate,
      };
    }

    // 이전 환율이 없는 경우 (첫 저장)
    return {
      isValid: true,
    };
  }
}
