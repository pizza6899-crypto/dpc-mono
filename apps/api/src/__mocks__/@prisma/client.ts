/* Jest mock for @prisma/client used in unit tests */
/* Jest mock for @prisma/client used in unit tests */
export const ArtifactGrade = {
  COMMON: 'COMMON',
  UNCOMMON: 'UNCOMMON',
  RARE: 'RARE',
  EPIC: 'EPIC',
  LEGENDARY: 'LEGENDARY',
  MYTHIC: 'MYTHIC',
  UNIQUE: 'UNIQUE',
} as const;
export type ArtifactGrade = (typeof ArtifactGrade)[keyof typeof ArtifactGrade];

export const ArtifactCatalogStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type ArtifactCatalogStatus = (typeof ArtifactCatalogStatus)[keyof typeof ArtifactCatalogStatus];

export const ExchangeCurrencyCode = {
  USD: 'USD',
  KRW: 'KRW',
  EUR: 'EUR',
} as const;
export type ExchangeCurrencyCode = (typeof ExchangeCurrencyCode)[keyof typeof ExchangeCurrencyCode];

export const ArtifactDrawPaymentType = {
  TICKET: 'TICKET',
  CURRENCY: 'CURRENCY',
} as const;
export type ArtifactDrawPaymentType = (typeof ArtifactDrawPaymentType)[keyof typeof ArtifactDrawPaymentType];

export const ArtifactDrawType = {
  SINGLE: 'SINGLE',
  MULTI: 'MULTI',
} as const;
export type ArtifactDrawType = (typeof ArtifactDrawType)[keyof typeof ArtifactDrawType];

export const ArtifactDrawStatus = {
  PENDING: 'PENDING',
  SETTLED: 'SETTLED',
  CLAIMED: 'CLAIMED',
} as const;
export type ArtifactDrawStatus = (typeof ArtifactDrawStatus)[keyof typeof ArtifactDrawStatus];

export class Prisma {
  static Decimal = class Decimal {
    private val: number;
    constructor(v: number | string | any) { this.val = Number(v); }
    toNumber() { return this.val; }
    mul(n: number) { return new Prisma.Decimal(this.val * n); }
  }
}

export class PrismaClient {
  constructor() {}
  $connect() { return Promise.resolve(); }
  $disconnect() { return Promise.resolve(); }
}
