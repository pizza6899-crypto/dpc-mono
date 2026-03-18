import { ExchangeCurrencyCode } from '@prisma/client';
import { WageringCurrencySetting } from './value-objects/wagering-currency-setting.vo';
import { InvalidWageringConfigException } from './wagering-config.exception';


export class WageringConfig {
  public static readonly SINGLETON_ID = 1n;

  constructor(
    public readonly id: bigint,
    public readonly currencySettings: Record<ExchangeCurrencyCode, WageringCurrencySetting>,
    public readonly isWageringCheckEnabled: boolean,
    public readonly isAutoCancellationEnabled: boolean,
    public readonly updatedAt: Date,
    public readonly updatedBy: bigint | null,
  ) {
    // 도메인 검증: 싱글톤 ID 확인
    if (id !== WageringConfig.SINGLETON_ID) {
      throw new InvalidWageringConfigException(
        `Config ID must be ${WageringConfig.SINGLETON_ID}`,
      );
    }
  }

  /**
   * 특정 통화의 설정을 가져오거나 기본값을 반환합니다.
   */
  getSetting(currency: ExchangeCurrencyCode): WageringCurrencySetting {
    return this.currencySettings[currency] ?? WageringCurrencySetting.empty();
  }

  static fromPersistence(data: {
    id: bigint;
    currencySettings: Record<ExchangeCurrencyCode, WageringCurrencySetting>;

    isWageringCheckEnabled: boolean;
    isAutoCancellationEnabled: boolean;
    updatedAt: Date;
    updatedBy: bigint | null;
  }): WageringConfig {
    return new WageringConfig(
      data.id,
      data.currencySettings,
      data.isWageringCheckEnabled,
      data.isAutoCancellationEnabled,
      data.updatedAt,
      data.updatedBy,
    );
  }
}
