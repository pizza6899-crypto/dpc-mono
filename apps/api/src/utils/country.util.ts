export interface CountryConfig {
  timezone: string;
}

export const COUNTRY_CONFIG_MAP: Record<string, CountryConfig> = {
  KR: {
    timezone: 'Asia/Seoul',
  },
  JP: {
    timezone: 'Asia/Tokyo',
  },
  US: {
    timezone: 'America/New_York',
  },
};

const DEFAULT_COUNTRY_CONFIG: CountryConfig = {
  timezone: 'Asia/Tokyo',
};

export class CountryUtil {
  static getCountryConfig({
    countryCode,
    timezone,
  }: {
    countryCode?: string;
    timezone?: string;
  }): CountryConfig {
    if (!countryCode) {
      return DEFAULT_COUNTRY_CONFIG;
    }

    const normalizedCode = countryCode?.toUpperCase();
    const config = COUNTRY_CONFIG_MAP[normalizedCode] || DEFAULT_COUNTRY_CONFIG;

    return {
      timezone: timezone || config.timezone,
    };
  }
}
