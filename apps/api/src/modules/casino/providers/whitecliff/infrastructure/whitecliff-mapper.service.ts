// infrastructure/whitecliff-mapper.service.ts

import { Injectable } from '@nestjs/common';
import { GameProvider, GameCategory, Language } from '@repo/database';
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

  /**
   * Evolution은 통화별로 다른 provider ID를 사용합니다.
   * - KRW: 31 (Evolution Korea)
   * - IDR: 29 (Evolution India)
   * - 기타: 1 (Evolution Asia)
   */
  toWhitecliffProviderWithCurrency(
    provider: GameProvider,
    gameCurrency: GamingCurrencyCode,
  ): number | null {
    if (provider === GameProvider.EVOLUTION) {
      switch (gameCurrency) {
        case 'KRW':
          return 31; // Evolution Korea
        case 'IDR':
          return 29; // Evolution India
        default:
          return 1; // Evolution Asia (default)
      }
    }

    return this.toWhitecliffProvider(provider);
  }

  /*
   * Whitecliff Supported Currencies Reference:
   *
   * Fiat:
   * BDT, BND, CNY, HKD, ID2, IDR, IN1, INR, JPY, KHR, KRW, LAK, LKR, MMK, MNT, MYR, NPR, NZD, PGK, PHP, PKR, THB, USD, VN2, VND, XAF,
   * AED, ARS, AUD, BOB, BRL, CAD, CLP, COP, DKK, ETB, EUR, GBP, GHS, ILS, KES, KZT, LBP, MXN, NGN, NOK, PEN, PLN, PYG, RON, RUB, SAR, SLE, TND, TRY, TZS, UZS, XOF, ZAR
   *
   * Crypto:
   * BNB, DOGE, ETH, LTC, TET (USDT), TON, USDC, XLM, XPS, XRP, XUS, mBTC, uBTC
   */
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
  /**
   * 내부 Language Enum을 Whitecliff 언어 코드로 변환
   */
  convertLanguageToWhitecliff(language: Language): string {
    return WhitecliffMapperService.WHITECLIFF_LANGUAGE_MAP[language] || 'en';
  }

  // Whitecliff 언어 코드 매핑
  private static readonly WHITECLIFF_LANGUAGE_MAP: Record<Language, string> = {
    [Language.EN]: 'en',
    [Language.KO]: 'ko',
    [Language.JA]: 'ja',

    // === Future Supported Languages (Commented out for reference) ===
    // 'sq': 'sq',       // 알바니아어
    // 'ar': 'ar',       // 아라빅어
    // 'hy': 'hy',       // 아르메니아어
    // 'bg': 'bg',       // 불가리아어
    // 'ca': 'ca',       // 카탈로니아어, 발렌시아어
    // 'zh': 'zh',       // 중국어(간체)
    // 'zh-Hans': 'zh-Hans', // 중국어(간체)
    // 'zh-Hant': 'zh-Hant', // 중국어(번체)
    // 'hr': 'hr',       // 크로아티아어
    // 'cs': 'cs',       // 체코어
    // 'da': 'da',       // 덴마크어
    // 'nl': 'nl',       // 네덜란드어
    // 'nl-BE': 'nl-BE', // 플랑드르어
    // 'en-GB': 'en-GB', // 영어(영국)
    // 'en-NL': 'en-NL', // 영어(네덜란드)
    // 'en-US': 'en-US', // 영어(미국)
    // 'en-150': 'en-150', // 영어(유럽)
    // 'et': 'et',       // 에스토니아어
    // 'fi': 'fi',       // 핀란드어
    // 'fr': 'fr',       // 프랑스어
    // 'fr-CA': 'fr-CA', // 프랑스어(캐나다)
    // 'ka': 'ka',       // 조지아어
    // 'de': 'de',       // 독일어
    // 'el': 'el',       // 그리스어(현대)
    // 'he': 'he',       // 히브리어
    // 'hi': 'hi',       // 힌디어
    // 'hu': 'hu',       // 헝가리어
    // 'id': 'id',       // 인도네시아어
    // 'it': 'it',       // 이탈리아어
    // 'lv': 'lv',       // 라트비아어
    // 'lt': 'lt',       // 리투아니아어
    // 'ms': 'ms',       // 말레이어
    // 'mn': 'mn',       // 몽골어
    // 'no': 'no',       // 노르웨이
    // 'pl': 'pl',       // 폴란드어
    // 'pt': 'pt',       // 포르투갈어(브라질)
    // 'pt-BR': 'pt-BR', // 포르투갈어(브라질)
    // 'pt-PT': 'pt-PT', // 포르투갈어(포르투갈)
    // 'ro': 'ro',       // 루마니아어, 몰도바어
    // 'ru': 'ru',       // 러시아어
    // 'sr': 'sr',       // 세르비아어
    // 'sk': 'sk',       // 슬로바키아어
    // 'sl': 'sl',       // 슬로베니아어
    // 'es': 'es',       // 스페인어
    // 'es-US': 'es-US', // 스페인어(미국)
    // 'sv': 'sv',       // 스웨덴어
    // 'th': 'th',       // 타이어
    // 'tr': 'tr',       // 터키어
    // 'uk': 'uk',       // 우크라이나어
    // 'vi': 'vi',       // 베트남어
  };
}
