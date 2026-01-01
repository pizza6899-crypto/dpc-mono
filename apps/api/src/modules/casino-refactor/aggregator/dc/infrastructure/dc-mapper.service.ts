// src/modules/casino-refactor/aggregator/dc/infrastructure/dc-mapper.service.ts

import { Injectable } from '@nestjs/common';
import { GameProvider, GameCategory } from '@repo/database';
import { GamingCurrencyCode } from 'src/utils/currency.util';

@Injectable()
export class DcMapperService {
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
   * DC 카테고리 코드 → Domain GameCategory 변환
   */
  toDomainCategory(categoryCode: string): GameCategory | null {
    return DcMapperService.CATEGORY_MAP[categoryCode] || null;
  }

  /**
   * Domain GameCategory → DC 카테고리 코드 변환
   */
  toDcCategory(category: GameCategory): string | null {
    return DcMapperService.CATEGORY_REVERSE_MAP[category] || null;
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

  /**
   * DC 프로바이더 ID → Domain GameProvider 변환
   */
  toDomainProvider(providerId: string): GameProvider | null {
    return DcMapperService.PROVIDER_MAP[providerId] || null;
  }

  /**
   * DC 프로바이더 ID → Domain GameProvider 변환 (DCS 호환성)
   */
  fromDcsProvider(providerId: string): GameProvider | null {
    return this.toDomainProvider(providerId);
  }

  /**
   * Domain GameProvider → DC 프로바이더 ID 변환
   */
  toDcProvider(provider: GameProvider): string | null {
    return DcMapperService.PROVIDER_REVERSE_MAP[provider] || null;
  }

  /**
   * Domain GamingCurrencyCode → DC 통화 코드 변환
   */
  toDcCurrency(currency: GamingCurrencyCode): string {
    switch (currency) {
      case 'USDT':
        return 'USD';
      default:
        return currency;
    }
  }

  /**
   * DC 통화 코드 → Domain GamingCurrencyCode 변환
   */
  toDomainCurrency(dcCurrency: string): GamingCurrencyCode {
    const normalizedDcCurrency = dcCurrency.toUpperCase();
    switch (normalizedDcCurrency) {
      default:
        return normalizedDcCurrency as GamingCurrencyCode;
    }
  }

  /**
   * DC 통화 코드 → Domain GamingCurrencyCode 변환 (DCS 호환성)
   */
  convertDcsCurrencyToGamingCurrency(dcCurrency: string): GamingCurrencyCode {
    return this.toDomainCurrency(dcCurrency);
  }

  /**
   * 국가 코드 변환
   * 'XX' (알 수 없음) → 'JP' (일본)로 변환, 그 외는 그대로 반환
   */
  toDcCountryCode(countryCode: string): string {
    return countryCode === 'XX' ? 'JP' : countryCode;
  }
}

