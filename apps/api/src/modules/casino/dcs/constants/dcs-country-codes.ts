/**
 * DCS Seamless Wallet API Country Codes
 * Reference: DCS Seamless wallet API document
 */
export enum DcsCountryCode {
  CN = 'CN', // China
  HK = 'HK', // Hong Kong
  TW = 'TW', // Taiwan
  KR = 'KR', // South Korea
  JP = 'JP', // Japan
  TH = 'TH', // Thailand
  PH = 'PH', // Philippines
  ID = 'ID', // Indonesia
  IN = 'IN', // India
  VN = 'VN', // Vietnam
  MY = 'MY', // Malaysia
  SG = 'SG', // Singapore
}

/**
 * DCS Country Code Descriptions
 */
export const DcsCountryDescriptions: Record<DcsCountryCode, string> = {
  [DcsCountryCode.CN]: 'China',
  [DcsCountryCode.HK]: 'Hong Kong',
  [DcsCountryCode.TW]: 'Taiwan',
  [DcsCountryCode.KR]: 'South Korea',
  [DcsCountryCode.JP]: 'Japan',
  [DcsCountryCode.TH]: 'Thailand',
  [DcsCountryCode.PH]: 'Philippines',
  [DcsCountryCode.ID]: 'Indonesia',
  [DcsCountryCode.IN]: 'India',
  [DcsCountryCode.VN]: 'Vietnam',
  [DcsCountryCode.MY]: 'Malaysia',
  [DcsCountryCode.SG]: 'Singapore',
};

/**
 * Array of all supported DCS country codes
 */
export const DCS_SUPPORTED_COUNTRIES = Object.values(DcsCountryCode);

/**
 * Helper function to get country description by code
 */
export function getDcsCountryDescription(
  code: DcsCountryCode | string,
): string {
  if (code in DcsCountryDescriptions) {
    return DcsCountryDescriptions[code as DcsCountryCode];
  }
  return 'Unknown country';
}

/**
 * Check if a country code is valid for DCS
 */
export function isValidDcsCountry(code: string): code is DcsCountryCode {
  return DCS_SUPPORTED_COUNTRIES.includes(code as DcsCountryCode);
}

/**
 * Normalize country code to uppercase
 * Ensures country codes are in the correct format (uppercase)
 */
export function normalizeDcsCountry(code: string): DcsCountryCode | null {
  const normalized = code.toUpperCase();

  if (isValidDcsCountry(normalized)) {
    return normalized;
  }

  return null;
}

/**
 * Convert internal country code to DCS country code
 * Maps common country code variations to DCS format
 */
export function toDcsCountryCode(internalCode: string): DcsCountryCode | null {
  const normalized = internalCode.toUpperCase();

  // Map common variations to DCS codes
  const countryMap: Record<string, DcsCountryCode> = {
    // Standard ISO 3166-1 alpha-2 codes
    CN: DcsCountryCode.CN,
    HK: DcsCountryCode.HK,
    TW: DcsCountryCode.TW,
    KR: DcsCountryCode.KR,
    JP: DcsCountryCode.JP,
    TH: DcsCountryCode.TH,
    PH: DcsCountryCode.PH,
    ID: DcsCountryCode.ID,
    IN: DcsCountryCode.IN,
    VN: DcsCountryCode.VN,
    MY: DcsCountryCode.MY,
    SG: DcsCountryCode.SG,

    // Alternative codes (if any)
    CHN: DcsCountryCode.CN, // ISO 3166-1 alpha-3
    HKG: DcsCountryCode.HK,
    TWN: DcsCountryCode.TW,
    KOR: DcsCountryCode.KR,
    JPN: DcsCountryCode.JP,
    THA: DcsCountryCode.TH,
    PHL: DcsCountryCode.PH,
    IDN: DcsCountryCode.ID,
    IND: DcsCountryCode.IN,
    VNM: DcsCountryCode.VN,
    MYS: DcsCountryCode.MY,
    SGP: DcsCountryCode.SG,
  };

  return countryMap[normalized] || null;
}

/**
 * Validate and normalize country code for DCS API
 * Returns the normalized code if valid, otherwise returns null
 */
export function validateDcsCountryCode(code: string): DcsCountryCode | null {
  // First try direct normalization
  const normalized = normalizeDcsCountry(code);
  if (normalized) {
    return normalized;
  }

  // Try conversion from internal format
  return toDcsCountryCode(code);
}
