import { Prisma } from '@prisma/client';
import { InvalidWageringConfigException } from '../wagering-config.exception';

export class WageringCurrencySetting {
  constructor(
    public readonly cancellationThreshold: Prisma.Decimal,
    public readonly minBetAmount: Prisma.Decimal,
    public readonly maxBetAmount: Prisma.Decimal,
  ) {
    // 도메인 검증: 금액 관련 수치는 음수일 수 없음
    if (cancellationThreshold.isNeg())
      throw new InvalidWageringConfigException(
        'Cancellation threshold cannot be negative',
      );
    if (minBetAmount.isNeg())
      throw new InvalidWageringConfigException(
        'Minimum bet amount cannot be negative',
      );
    if (maxBetAmount.isNeg())
      throw new InvalidWageringConfigException(
        'Maximum bet amount cannot be negative',
      );

    // 최소 베팅액이 최대 베팅액보다 클 수 없음 (0은 무제한을 의미)
    if (!maxBetAmount.isZero() && minBetAmount.greaterThan(maxBetAmount)) {
      throw new InvalidWageringConfigException(
        'Minimum bet amount cannot be greater than maximum bet amount',
      );
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
  static fromRaw(data: {
    cancellationThreshold?: number | string | Prisma.Decimal;
    minBetAmount?: number | string | Prisma.Decimal;
    maxBetAmount?: number | string | Prisma.Decimal;
  }): WageringCurrencySetting {
    return new WageringCurrencySetting(
      new Prisma.Decimal(data.cancellationThreshold ?? 0),
      new Prisma.Decimal(data.minBetAmount ?? 0),
      new Prisma.Decimal(data.maxBetAmount ?? 0),
    );
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
