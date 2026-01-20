// infrastructure/whitecliff-mapper.service.ts

import { Injectable } from '@nestjs/common';
import { GameProvider, GameCategory } from '@repo/database';
import { GamingCurrencyCode } from 'src/utils/currency.util';

@Injectable()
export class WhitecliffMapperService {
  // 카테고리 맵핑
  private static readonly CATEGORY_MAP: Record<string, GameCategory> = {
    'Live Casino': GameCategory.LIVE_CASINO,
    Slots: GameCategory.SLOTS,
  };

  private static readonly CATEGORY_REVERSE_MAP: Record<GameCategory, string> = {
    [GameCategory.LIVE_CASINO]: 'Live Casino',
    [GameCategory.SLOTS]: 'Slots',
  };

  fromWhitecliffCategory(categoryCode: string): GameCategory {
    return WhitecliffMapperService.CATEGORY_MAP[categoryCode];
  }

  toWhitecliffCategory(category: GameCategory): string {
    return WhitecliffMapperService.CATEGORY_REVERSE_MAP[category];
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

  fromWhitecliffProvider(providerId: number): GameProvider | null {
    return WhitecliffMapperService.PROVIDER_MAP[providerId] || null;
  }

  toWhitecliffProvider(provider: GameProvider): number | null {
    return WhitecliffMapperService.PROVIDER_REVERSE_MAP[provider] || null;
  }

  convertGamingCurrencyToWhitecliffCurrency(
    gameCurrency: GamingCurrencyCode,
  ): string {
    switch (gameCurrency) {
      case 'USDT':
        return 'TET';
      case 'VND':
        return 'VN2';
      default:
        return gameCurrency;
    }
  }

  convertWhitecliffCurrencyToGamingCurrency(
    whitecliffCurrency: string,
  ): GamingCurrencyCode {
    const normalizedWhitecliffCurrency = whitecliffCurrency.toUpperCase();

    switch (normalizedWhitecliffCurrency) {
      case 'TET':
        return 'USDT';
      case 'USD':
        return 'USD';
      case 'KRW':
        return 'KRW';
      case 'JPY':
        return 'JPY';
      case 'PHP':
        return 'PHP';
      case 'VN2':
        return 'VND';
      default:
        return normalizedWhitecliffCurrency as GamingCurrencyCode;
    }
  }
}
