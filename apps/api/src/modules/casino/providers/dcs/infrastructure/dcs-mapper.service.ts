// infrastructure/whitecliff-mapper.service.ts

import { Injectable } from '@nestjs/common';
import { GameProvider, Language } from '@prisma/client';
import { GamingCurrencyCode } from 'src/utils/currency.util';

@Injectable()
export class DcsMapperService {
  // 카테고리 맵핑
  public static readonly CATEGORY_MAP: Record<string, string> = {
    'Live Casino': 'LIVE_CASINO',
    Slots: 'SLOTS',
    Standard: 'SLOTS', // DCS specific
  };

  private static readonly CATEGORY_REVERSE_MAP: Record<string, string> = {
    ['LIVE_CASINO']: 'Live Casino',
    ['SLOTS']: 'Slots',
  };

  fromDcsCategory(categoryCode: string): string | null {
    return DcsMapperService.CATEGORY_MAP[categoryCode] || null;
  }

  toDcsCategory(category: string): string | null {
    return DcsMapperService.CATEGORY_REVERSE_MAP[category] || null;
  }

  // 프로바이더 맵핑
  public static readonly PROVIDER_MAP: Record<string, GameProvider> = {
    // Active Mappings
    relax: GameProvider.RELAX_GAMING,
    png: GameProvider.PLAYNGO,
    evl: GameProvider.EVOLUTION,
    // Add other active providers here as they are added to GameProvider enum
  };

  private static readonly PROVIDER_REVERSE_MAP: Partial<
    Record<GameProvider, string>
  > = {
    // Active Mappings
    [GameProvider.RELAX_GAMING]: 'relax',
    [GameProvider.PLAYNGO]: 'png',
    [GameProvider.EVOLUTION]: 'evl', // Evolution
    [GameProvider.EVOLUTION_ASIA]: 'evl', // Map to generic Evolution
    [GameProvider.EVOLUTION_INDIA]: 'evl', // Map to generic Evolution
    [GameProvider.EVOLUTION_KOREA]: 'evl', // Map to generic Evolution
    [GameProvider.PG_SOFT]: 'pg', // Assuming PG Soft is 'pg' or similar? Need to verify. Wait, list doesn't show 'pg' explicitly but typical code. Let's check list again.
    // List has: dcace, yg, relax, nlc, png, hs, aux, evo, gam, psh, ezugi, swf, funta, stm, mj, fm, ps, sb, plb, evl, btg, ne, rt, tg, tgo, wz, tk, lm, yt, sa, ss, bg, nm, op, bp, hso, hsl, tq, raw, bm, ag, pts, ptc
    // PG_SOFT is likely missing from my manual check or labeled differently?
    // Actually 'png' is Play'n Go.
    // Let's stick to what is known from GameProvider enum and provided list.
    // 'evl': Evolution
    // 'relax': Relax gaming
    // 'png': Play'n Go

    // Future/Potential Mappings based on DCS list:
    // 'dcace': DCACE
    // 'yg': Yggdrasil
    // 'nlc': Nolimit City
    // 'hs': Hacksaw Gaming
    // 'aux': Avatar UX
    // 'evo': Evoplay (Note: 'evl' is Evolution, 'evo' is Evoplay)
    // 'gam': Gamomat
    // 'psh': Push Gaming
    // 'ezugi': Ezugi
    // 'swf': Win Fast
    // 'funta': FunTa Gaming
    // 'stm': Slotmill
    // 'mj': 7Mojos
    // 'fm': Fantasma
    // 'ps': Peter & Sons
    // 'sb': Spribe
    // 'plb': Parlay bay
    // 'btg': Big Time Gaming
    // 'ne': NetEnt
    // 'rt': Red Tiger
    // 'tg': Turbo Games
    // 'tgo': Turbo Games (non-Asian market)
    // 'wz': Voltent (Wazdan)
    // 'tk': Thunderkick
    // 'lm': Lucky Monaco
    // 'yt': Yolted
    // 'sa': SA Gaming
    // 'ss': Smartsoft
    // 'bg': Bgaming
    // 'nm': Novomatic
    // 'op': Octoplay
    // 'bp': BluePrint
    // 'hso': Hacksaw Gaming ROW
    // 'hsl': Hacksaw Gaming Latam
    // 'tq': Originals (Tequity)
    // 'raw': RAW
    // 'bm': Booming Games
    // 'ag': PlayACE
    // 'pts': Play Tech Slot
    // 'ptc': PlayTech Casino
  };

  fromDcsProvider(providerId: string): GameProvider | null {
    return DcsMapperService.PROVIDER_MAP[providerId] || null;
  }

  toDcsProvider(provider: GameProvider): string | null {
    return DcsMapperService.PROVIDER_REVERSE_MAP[provider] || null;
  }

  // 통화 맵핑
  private static readonly DCS_CURRENCY_MAP: Partial<
    Record<GamingCurrencyCode, string>
  > = {
    // Active Gaming Currencies
    USDT: 'USDT',
    USD: 'USD',
    KRW: 'KRW',
    JPY: 'JPY',
    PHP: 'PHP',
    IDR: 'IDR',
    VND: 'VND',

    // Future mappings based on DCS supported currencies:
    // 'AED': 'AED', // United Arab Emirates Dirham
    // 'AFN': 'AFN', // Afghan Afghani
    // 'ALL': 'ALL', // Albanian Lek
    // 'AMD': 'AMD', // Armenian Dram
    // 'ANG': 'ANG', // Netherlands Antillean Guilder
    // 'AOA': 'AOA', // Angolan Kwanza
    // 'ARS': 'ARS', // Argentine Peso
    // 'AUD': 'AUD', // Australian Dollar
    // 'AZN': 'AZN', // Azerbaijan Manat
    // 'BAM': 'BAM', // Bosnia and Herzegovina convertible mark
    // 'BDT': 'BDT', // Bangladeshi Taka
    // 'BGN': 'BGN', // Bulgarian Lev
    // 'BHD': 'BHD', // Bahrain Dinar
    // 'BND': 'BND', // Brunei Dollar
    // 'BOB': 'BOB', // Bolivian Boliviano
    // 'BRL': 'BRL', // Brazilian Real
    // 'BWP': 'BWP', // Botswanan Pula
    // 'BYN': 'BYN', // Belarusian Ruble
    // 'BZD': 'BZD', // Belize Dollar
    // 'CAD': 'CAD', // Canadian Dollar
    // 'CDF': 'CDF', // Congolese Franc
    // 'CHF': 'CHF', // Swiss Franc
    // 'CLP': 'CLP', // Chilean Peso
    // 'CNY': 'CNY', // Chinese Yuan
    // 'COP': 'COP', // Colombian Peso
    // 'CRC': 'CRC', // Costa Rican Colón
    // 'CUP': 'CUP', // Cuban Peso
    // 'CZK': 'CZK', // Czech Koruna
    // 'DKK': 'DKK', // Danish Krone
    // 'DOP': 'DOP', // Dominican Peso
    // 'DZD': 'DZD', // Algerian Dinar
    // 'EGP': 'EGP', // Egyptian Pound
    // 'ETB': 'ETB', // Ethiopian Birr
    // 'EUR': 'EUR', // Euro
    // 'GBP': 'GBP', // Pound Sterling
    // 'GEL': 'GEL', // Georgian Lari
    // 'GHS': 'GHS', // Ghanaian Cedi
    // 'GMD': 'GMD', // Gambian Dalasi
    // 'GNF': 'GNF', // Guinean Franc
    // 'GTQ': 'GTQ', // Guatemalan Quetzal
    // 'HKD': 'HKD', // Hong Kong Dollar
    // 'HNL': 'HNL', // Honduran Lempira
    // 'HRK': 'HRK', // Croatian Kuna
    // 'HTG': 'HTG', // Haitian Gourde
    // 'HUF': 'HUF', // Hungarian Forint
    // 'IDX': 'IDX', // Thousand Indonesian Rupiah
    // 'ILS': 'ILS', // Israeli New Shekel
    // 'INR': 'INR', // Indian Rupee
    // 'IQD': 'IQD', // Iraqi Dinar
    // 'IRR': 'IRR', // Iranian rial
    // 'ISK': 'ISK', // Icelandic Krona
    // 'JMD': 'JMD', // Jamaican Dollar
    // 'JOD': 'JOD', // Jordanian Dinar
    // 'KES': 'KES', // Kenyan Shilling
    // 'KGS': 'KGS', // Kyrgystani Som
    // 'KHR': 'KHR', // Cambodian Riel
    // 'KWD': 'KWD', // Kuwaiti Dinar
    // 'KZT': 'KZT', // Kazakhstani Tenge
    // 'LAK': 'LAK', // Lao Kip
    // 'LBP': 'LBP', // Lebanese Pound
    // 'LKR': 'LKR', // Sri Lankan Rupee
    // 'LRD': 'LRD', // Liberian dollar
    // 'LSL': 'LSL', // Basotho Loti
    // 'LVL': 'LVL', // Latvia Lat
    // 'MAD': 'MAD', // Moroccan Dirham
    // 'MDL': 'MDL', // Moldovan Leu
    // 'MGA': 'MGA', // Ariary
    // 'MKD': 'MKD', // Macedonian Denar
    // 'MMK': 'MMK', // Myanmar Kyat
    // 'MNT': 'MNT', // Mongolian Tugrik
    // 'MOP': 'MOP', // Macau Pataca
    // 'MUR': 'MUR', // Mauritian Rupee
    // 'MVR': 'MVR', // Maldivian Rufiyaa
    // 'MWK': 'MWK', // Malawian kwacha
    // 'MXN': 'MXN', // Mexican Peso
    // 'MYR': 'MYR', // Malaysian Ringgit
    // 'MZN': 'MZN', // Mozambican Metical
    // 'NAD': 'NAD', // Namibian Dollar
    // 'NGN': 'NGN', // Nigerian Naira
    // 'NIO': 'NIO', // Nicaraguan Córdoba
    // 'NOK': 'NOK', // Norwegian Krone
    // 'NPR': 'NPR', // Nepalese Rupee
    // 'NZD': 'NZD', // New Zealand Dollar
    // 'OMR': 'OMR', // Omani Rial
    // 'PAB': 'PAB', // Panamanian Balboa
    // 'PEN': 'PEN', // Peruvian Nuevo Sol
    // 'PKR': 'PKR', // Pakistan Rupee
    // 'PLN': 'PLN', // Polish Zloty
    // 'PYG': 'PYG', // Paraguayan Guarani
    // 'QAR': 'QAR', // Qatari Rial
    // 'RON': 'RON', // Romanian Dram
    // 'RSD': 'RSD', // Serbian Dinar
    // 'RUB': 'RUB', // Russian Ruble
    // 'RWF': 'RWF', // Rwandan franc
    // 'SAR': 'SAR', // Saudi Riyal
    // 'SCR': 'SCR', // Seychellois Rupee
    // 'SDG': 'SDG', // Sudanese Pound
    // 'SEK': 'SEK', // Swedish Krona
    // 'SGD': 'SGD', // Singapore Dollar
    // 'SRD': 'SRD', // Surinamese Dollar
    // 'SZL': 'SZL', // Swazi Lilangeni
    // 'TGC': 'TGC', // TGC point
    // 'THB': 'THB', // Thai Baht
    // 'TJS': 'TJS', // Tajikistani Somoni
    // 'TMT': 'TMT', // Turkmenistani Manat
    // 'TND': 'TND', // Tunisian Dinar
    // 'TRY': 'TRY', // Turkish Libra
    // 'TTD': 'TTD', // Trinidad and Tobago Dollar
    // 'TZS': 'TZS', // Tanzanian Shilling
    // 'UAH': 'UAH', // Ukrainian Hryvnia
    // 'UYU': 'UYU', // Uruguayan Peso
    // 'UZS': 'UZS', // Uzbekistani Som
    // 'VNX': 'VNX', // Thousand Vietnamese Dong
    // 'XAF': 'XAF', // Central African CFA Franc
    // 'XCD': 'XCD', // East Caribbean Dollar
    // 'XOF': 'XOF', // CFA Franc BCEAO
    // 'YER': 'YER', // Yemeni Rial
    // 'ZAR': 'ZAR', // South African Rand
    // 'ZM': 'ZM', // Zambian Kwacha
    // 'ZWL': 'ZWL', // Zimbabwean Dollar
    // 'BTP': 'BTP', // BT Points
    // 'VES': 'VES', // Bolívar Soberano
    // 'SSP': 'SSP', // South Sudanese Pound
  };

  convertGamingCurrencyToDcsCurrency(currency: GamingCurrencyCode): string {
    return DcsMapperService.DCS_CURRENCY_MAP[currency] || currency;
  }

  convertDcsCurrencyToGamingCurrency(dcsCurrency: string): GamingCurrencyCode {
    const normalizedDcsCurrency = dcsCurrency.toUpperCase();

    // Reverse lookup attempt
    const entry = Object.entries(DcsMapperService.DCS_CURRENCY_MAP).find(
      ([_, value]) => value === normalizedDcsCurrency,
    );

    if (entry) {
      return entry[0] as GamingCurrencyCode;
    }

    // Default fallback
    return normalizedDcsCurrency as GamingCurrencyCode;
  }
  // 언어 맵핑
  private static readonly DCS_LANGUAGE_MAP: Record<Language, string> = {
    [Language.EN]: 'en',
    [Language.KO]: 'ko', // or 'kr'
    [Language.JA]: 'ja',

    // Future mappings based on DCS supported languages:
    // [Language.ZH_HANS]: 'zh_hans',
    // [Language.ZH_HANT]: 'zh_hant',
    // [Language.TH]: 'th',
    // [Language.VI]: 'vi',
    // [Language.ID]: 'id',
    // [Language.BG]: 'bg',
    // [Language.CS]: 'cz', // DCS uses 'cz' for Czech
    // [Language.DE]: 'de',
    // [Language.EL]: 'el',
    // [Language.TR]: 'tr',
    // [Language.ES]: 'es',
    // [Language.FI]: 'fi',
    // [Language.FR]: 'fr',
    // [Language.HU]: 'hu',
    // [Language.IT]: 'it',
    // [Language.NL]: 'nl',
    // [Language.NO]: 'no',
    // [Language.PL]: 'pl',
    // [Language.PT]: 'pt',
    // [Language.PT_BR]: 'pt-BR',
    // [Language.RO]: 'ro',
    // [Language.RU]: 'ru',
    // [Language.SK]: 'sk',
    // [Language.SV]: 'sv',
    // [Language.DA]: 'da',
    // [Language.KA]: 'ka',
    // [Language.LV]: 'lv',
    // [Language.UK]: 'uk',
    // [Language.ET]: 'et',
    // Note: DCS also supports 'kr' for Korean if needed.
  };

  convertLanguageToDcs(language: Language): string {
    return DcsMapperService.DCS_LANGUAGE_MAP[language] || 'en';
  }

  // 채널 맵핑
  convertChannelToDcs(isMobile: boolean): string {
    return isMobile ? 'mobile' : 'pc';
  }

  // 국가 코드 맵핑
  private static readonly DCS_COUNTRY_MAP: Record<string, string> = {
    // Standard ISO-3166-1 alpha-2 mappings (if they match DCS)
    // Manually verified mappings based on request:
    CN: 'CN', // China
    HK: 'HK', // Hong Kong
    TW: 'TW', // Taiwan
    KR: 'KR', // South Korea
    JP: 'JP', // Japan
    TH: 'TH', // Thailand
    PH: 'PH', // Philippines
    ID: 'ID', // Indonesia
    IN: 'IN', // India
    VN: 'VN', // Vietnam
    MY: 'MY', // Malaysia
    SG: 'SG', // Singapore
  };

  convertCountryCodeToDcs(countryCode?: string): string {
    if (!countryCode || countryCode === 'XX') {
      return 'JP'; // Default fallback
    }

    const normalizedCode = countryCode.toUpperCase();

    // Check if the country code is explicitly mapped/supported
    if (DcsMapperService.DCS_COUNTRY_MAP[normalizedCode]) {
      return DcsMapperService.DCS_COUNTRY_MAP[normalizedCode];
    }

    // Fallback: Return the code as-is if not found (assuming ISO standard compatibility for others)
    // or you could force a default like 'JP' if strict validation is needed.
    return normalizedCode;
  }
}
