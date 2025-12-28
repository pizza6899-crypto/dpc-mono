// src/utils/currency.util.ts
import { ExchangeCurrencyCode } from '@repo/database';

/**
 * 환경 변수에서 월렛 통화 목록을 읽어옵니다.
 * WALLET_ALLOWED_CURRENCIES 환경 변수가 설정되어 있으면 사용하고,
 * 없으면 기본값을 사용합니다.
 */
function getWalletCurrenciesFromEnv(): readonly ExchangeCurrencyCode[] {
  const envCurrencies = process.env.WALLET_ALLOWED_CURRENCIES;

  if (envCurrencies) {
    const currencies = envCurrencies
      .split(',')
      .map((c) => c.trim().toUpperCase() as ExchangeCurrencyCode)
      .filter((c): c is ExchangeCurrencyCode =>
        Object.values(ExchangeCurrencyCode).includes(c),
      );

    // 유효한 통화가 있으면 반환, 없으면 기본값 사용
    if (currencies.length > 0) {
      return currencies as readonly ExchangeCurrencyCode[];
    }
  }

  return [];
}

/**
 * 유저 월렛에 사용 가능한 통화 코드 (암호화폐 + 피아트)
 * 환경 변수 WALLET_ALLOWED_CURRENCIES로 설정 가능
 * 예: WALLET_ALLOWED_CURRENCIES=USDT,BTC,ETH,KRW
 */
export const WALLET_CURRENCIES = getWalletCurrenciesFromEnv();

/**
 * 게이밍에 사용 가능한 통화 코드 (피아트 + 일부 암호화폐)
 */
export const GAMING_CURRENCIES = [
  ExchangeCurrencyCode.USDT,
  ExchangeCurrencyCode.USD,
  ExchangeCurrencyCode.KRW,
  ExchangeCurrencyCode.JPY,
  ExchangeCurrencyCode.PHP,
  ExchangeCurrencyCode.IDR,
  ExchangeCurrencyCode.VND,
] as const;

/**
 * 유저 월렛 통화 타입
 */
export type WalletCurrencyCode = (typeof WALLET_CURRENCIES)[number];

/**
 * 게이밍 통화 타입
 */
export type GamingCurrencyCode = (typeof GAMING_CURRENCIES)[number];
