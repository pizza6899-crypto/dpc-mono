import { Injectable } from '@nestjs/common';
import { WageringConfig } from '../domain/wagering-config.entity';
import { WageringCurrencySetting } from '../domain/value-objects/wagering-currency-setting.vo';
import { Prisma } from '@prisma/client';
import type { WageringConfig as PrismaWageringConfig } from '@prisma/client';
import {
  Cast,
  PersistenceOf,
} from 'src/infrastructure/persistence/persistence.util';

@Injectable()
export class WageringConfigMapper {
  /**
   * DB 또는 캐시(Redis 포함)에서 온 데이터를 도메인 엔티티로 변환합니다.
   */
  toDomain(data: PersistenceOf<PrismaWageringConfig>): WageringConfig {
    const rawSettings = (data.currencySettings ?? {}) as Record<string, any>;
    const currencySettings: Record<string, WageringCurrencySetting> = {};

    for (const [currency, settingData] of Object.entries(rawSettings)) {
      currencySettings[currency] = WageringCurrencySetting.fromRaw(settingData);
    }

    return WageringConfig.fromPersistence({
      id: Cast.bigint(data.id),
      currencySettings,
      isWageringCheckEnabled: data.isWageringCheckEnabled,
      isAutoCancellationEnabled: data.isAutoCancellationEnabled,
      updatedAt: Cast.date(data.updatedAt),
      updatedBy: Cast.bigint(data.updatedBy),
    });
  }

  /**
   * 도메인 엔티티를 Prisma가 이해할 수 있는 원시 데이터로 변환합니다.
   */
  toPrisma(domain: WageringConfig): Prisma.WageringConfigUncheckedUpdateInput {
    const currencySettings: Record<string, any> = {};

    for (const [currency, setting] of Object.entries(domain.currencySettings)) {
      currencySettings[currency] = setting.toRaw();
    }

    return {
      id: domain.id,
      currencySettings: currencySettings as unknown as Prisma.InputJsonValue,
      isWageringCheckEnabled: domain.isWageringCheckEnabled,
      isAutoCancellationEnabled: domain.isAutoCancellationEnabled,
      updatedBy: domain.updatedBy,
    };
  }
}
