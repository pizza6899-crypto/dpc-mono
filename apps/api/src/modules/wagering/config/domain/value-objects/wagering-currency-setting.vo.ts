import { Prisma } from '@prisma/client';
import {
  InvalidWageringConfigException,
  WageringConfigInvalidNumberFormatException,
  WageringConfigMinGTMaxException,
  WageringConfigNegativeValueException,
} from '../wagering-config.exception';

export interface WageringCurrencySettingProps {
  cancellationThreshold: number | string | Prisma.Decimal;
  minBetAmount: number | string | Prisma.Decimal;
  maxBetAmount: number | string | Prisma.Decimal;
}

export class WageringCurrencySetting {
  constructor(
    public readonly cancellationThreshold: Prisma.Decimal,
    public readonly minBetAmount: Prisma.Decimal,
    public readonly maxBetAmount: Prisma.Decimal,
  ) {
    // 도메인 검증: 금액 관련 수치는 음수일 수 없음
    if (cancellationThreshold.isNeg())
      throw new WageringConfigNegativeValueException('Cancellation threshold');
    if (minBetAmount.isNeg())
      throw new WageringConfigNegativeValueException('Minimum bet amount');
    if (maxBetAmount.isNeg())
      throw new WageringConfigNegativeValueException('Maximum bet amount');
    // 최소 베팅액이 최대 베팅액보다 클 수 없음 (0은 무제한을 의미)
    if (!maxBetAmount.isZero() && minBetAmount.greaterThan(maxBetAmount)) {
      throw new WageringConfigMinGTMaxException();
    }
  }

  /**
   * 기본값을 가진 설정 객체를 생성합니다.
   */
  static empty(): WageringCurrencySetting {
    const zero = new Prisma.Decimal(0);
    return new WageringCurrencySetting(zero, zero, zero);
  }

  /**
   * 원시 데이터(JSON)로부터 설정 객체를 생성합니다.
   */
  static fromRaw(
    data: Partial<WageringCurrencySettingProps>,
  ): WageringCurrencySetting {
    try {
      return new WageringCurrencySetting(
        new Prisma.Decimal(data.cancellationThreshold ?? 0),
        new Prisma.Decimal(data.minBetAmount ?? 0),
        new Prisma.Decimal(data.maxBetAmount ?? 0),
      );
    } catch {
      throw new WageringConfigInvalidNumberFormatException();
    }
  }

  /**
   * 다시 JSON 저장을 위해 정밀도를 유지한 채 원시 데이터로 변환합니다.
   * (Prisma가 Decimal을 처리할 수 있도록 string 또는 Decimal 유지)
   */
  toRaw(): Record<string, string | number> {
    return {
      cancellationThreshold: this.cancellationThreshold.toString(),
      minBetAmount: this.minBetAmount.toString(),
      maxBetAmount: this.maxBetAmount.toString(),
    };
  }
}
