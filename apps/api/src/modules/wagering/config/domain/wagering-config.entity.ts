import { Prisma } from '@prisma/client';
import { WageringCurrencySetting } from './value-objects/wagering-currency-setting.vo';
import { InvalidWageringConfigException } from './wagering-config.exception';

export class WageringConfig {
  public static readonly SINGLETON_ID = 1n;

  constructor(
    public readonly id: bigint,
    public readonly defaultBonusExpiryDays: number,
    public readonly defaultDepositMultiplier: Prisma.Decimal,
    public readonly currencySettings: Record<string, WageringCurrencySetting>,
    public readonly isWageringCheckEnabled: boolean,
    public readonly isAutoCancellationEnabled: boolean,
    public readonly updatedAt: Date,
    public readonly updatedBy: bigint | null,
  ) {
    // 도메인 검증
    if (defaultBonusExpiryDays < 1) {
      throw new InvalidWageringConfigException(
        'Default bonus expiry days must be at least 1 day',
      );
    }
    if (defaultDepositMultiplier.lessThan(0)) {
      throw new InvalidWageringConfigException(
        'Default deposit multiplier cannot be negative',
      );
    }
  }

  /**
   * 특정 통화의 설정을 가져오거나 기본값을 반환합니다.
   */
  getSetting(currency: string): WageringCurrencySetting {
    return this.currencySettings[currency] ?? WageringCurrencySetting.empty();
  }

  static fromPersistence(data: {
    id: bigint;
    defaultBonusExpiryDays: number;
    defaultDepositMultiplier: Prisma.Decimal | number | string;
    currencySettings: Record<string, WageringCurrencySetting>;
    isWageringCheckEnabled: boolean;
    isAutoCancellationEnabled: boolean;
    updatedAt: Date;
    updatedBy: bigint | null;
  }): WageringConfig {
    return new WageringConfig(
      data.id,
      data.defaultBonusExpiryDays,
      new Prisma.Decimal(data.defaultDepositMultiplier),
      data.currencySettings,
      data.isWageringCheckEnabled,
      data.isAutoCancellationEnabled,
      data.updatedAt,
      data.updatedBy,
    );
  }
}
