// src/modules/casino-refactor/aggregator/wc/infrastructure/wc-mapper.service.ts

import { Injectable } from '@nestjs/common';
import { GameProvider, GameCategory } from '@repo/database';
import { GamingCurrencyCode } from 'src/utils/currency.util';

@Injectable()
export class WcMapperService {
  // 카테고리 맵핑
  private static readonly CATEGORY_MAP: Record<string, GameCategory> = {
    'Live Casino': GameCategory.LIVE_CASINO,
    Slots: GameCategory.SLOTS,
  };

  private static readonly CATEGORY_REVERSE_MAP: Record<GameCategory, string> = {
    [GameCategory.LIVE_CASINO]: 'Live Casino',
    [GameCategory.SLOTS]: 'Slots',
  };

  /**
   * WC 카테고리 코드 → Domain GameCategory 변환
   */
  toDomainCategory(categoryCode: string): GameCategory | null {
    return WcMapperService.CATEGORY_MAP[categoryCode] || null;
  }

  /**
   * Domain GameCategory → WC 카테고리 코드 변환
   */
  toWcCategory(category: GameCategory): string | null {
    return WcMapperService.CATEGORY_REVERSE_MAP[category] || null;
  }

  // 프로바이더 맵핑
  private static readonly PROVIDER_MAP: Record<number, GameProvider> = {
    1: GameProvider.EVOLUTION,
    29: GameProvider.EVOLUTION,
    31: GameProvider.EVOLUTION,
    28: GameProvider.PRAGMATIC_PLAY_LIVE,
    285: GameProvider.PG_SOFT,
    226: GameProvider.PRAGMATIC_PLAY_SLOTS,
  };

  private static readonly PROVIDER_REVERSE_MAP: Partial<
    Record<GameProvider, number>
  > = {
    [GameProvider.EVOLUTION]: 1,
    [GameProvider.PRAGMATIC_PLAY_LIVE]: 28,
    [GameProvider.PG_SOFT]: 285,
    [GameProvider.PRAGMATIC_PLAY_SLOTS]: 226,
  };

  /**
   * WC 프로바이더 ID → Domain GameProvider 변환
   */
  toDomainProvider(providerId: number): GameProvider | null {
    return WcMapperService.PROVIDER_MAP[providerId] || null;
  }

  /**
   * Domain GameProvider → WC 프로바이더 ID 변환
   */
  toWcProvider(provider: GameProvider): number | null {
    return WcMapperService.PROVIDER_REVERSE_MAP[provider] || null;
  }

  /**
   * Domain GamingCurrencyCode → WC 통화 코드 변환
   */
  toWcCurrency(currency: GamingCurrencyCode): string {
    switch (currency) {
      case 'USDT':
        return 'TET';
      case 'VND':
        return 'VN2';
      default:
        return currency;
    }
  }

  /**
   * WC 통화 코드 → Domain GamingCurrencyCode 변환
   */
  toDomainCurrency(wcCurrency: string): GamingCurrencyCode {
    const normalizedWcCurrency = wcCurrency.toUpperCase();
    switch (normalizedWcCurrency) {
      case 'TET':
        return 'USDT';
      case 'VN2':
        return 'VND';
      default:
        return normalizedWcCurrency as GamingCurrencyCode;
    }
  }
}

