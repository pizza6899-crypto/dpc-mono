// infrastructure/whitecliff-mapper.service.ts

import { Injectable } from '@nestjs/common';
import { GameProvider, GameCategory } from '@repo/database';
import { GamingCurrencyCode } from 'src/utils/currency.util';

@Injectable()
export class DcsMapperService {
  // 카테고리 맵핑
  private static readonly CATEGORY_MAP: Record<string, GameCategory> = {
    'Live Casino': GameCategory.LIVE_CASINO,
    Slots: GameCategory.SLOTS,
  };

  private static readonly CATEGORY_REVERSE_MAP: Record<GameCategory, string> = {
    [GameCategory.LIVE_CASINO]: 'Live Casino',
    [GameCategory.SLOTS]: 'Slots',
  };

  fromDcsCategory(categoryCode: string): GameCategory | null {
    return DcsMapperService.CATEGORY_MAP[categoryCode] || null;
  }

  toDcsCategory(category: GameCategory): string | null {
    return DcsMapperService.CATEGORY_REVERSE_MAP[category] || null;
  }

  // 프로바이더 맵핑
  private static readonly PROVIDER_MAP: Record<string, GameProvider> = {
    relax: GameProvider.RELAX_GAMING,
    png: GameProvider.PLAYNGO,
  };

  private static readonly PROVIDER_REVERSE_MAP: Partial<
    Record<GameProvider, string>
  > = {
    [GameProvider.RELAX_GAMING]: 'relax',
    [GameProvider.PLAYNGO]: 'png',
  };

  fromDcsProvider(providerId: string): GameProvider | null {
    return DcsMapperService.PROVIDER_MAP[providerId] || null;
  }

  toDcsProvider(provider: GameProvider): string | null {
    return DcsMapperService.PROVIDER_REVERSE_MAP[provider] || null;
  }

  convertGamingCurrencyToDcsCurrency(currency: GamingCurrencyCode): string {
    switch (currency) {
      case 'USDT':
        return 'USD';
      default:
        return currency;
    }
  }

  convertDcsCurrencyToGamingCurrency(dcsCurrency: string): GamingCurrencyCode {
    const normalizedDcsCurrency = dcsCurrency.toUpperCase();
    switch (normalizedDcsCurrency) {
      default:
        return normalizedDcsCurrency as GamingCurrencyCode;
    }
  }
}
