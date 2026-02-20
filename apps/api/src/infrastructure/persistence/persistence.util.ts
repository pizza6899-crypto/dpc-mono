import { Prisma } from '@prisma/client';

/**
 * 캐시(Redis)나 DB에서 가져온 데이터를 도메인 타입으로 안전하게 변환하는 유틸리티
 */
export const Cast = {
  /** BigInt 복원 (string | number -> bigint) */
  bigint: (v: any): bigint => {
    if (v === null || v === undefined) return v;
    return typeof v === 'bigint' ? v : BigInt(v);
  },

  /** Decimal 복원 (string | number -> Decimal) */
  decimal: (v: any): Prisma.Decimal => {
    if (v === null || v === undefined) return v;
    return v instanceof Prisma.Decimal ? v : new Prisma.Decimal(v);
  },

  /** Date 복원 (string -> Date) */
  date: (v: any): Date => {
    if (v === null || v === undefined) return v;
    return v instanceof Date ? v : new Date(v);
  },
};

/**
 * Prisma 타입을 캐시 친화적인(string 허용) 영속성 타입으로 자동 변환해주는 유틸리티 타입
 * - bigint -> bigint | string
 * - Decimal -> Decimal | string | number
 * - Date -> Date | string
 */
export type PersistenceOf<T> = {
  [K in keyof T]: T[K] extends bigint | null | undefined
    ? bigint | string | (T[K] & (null | undefined))
    : T[K] extends Prisma.Decimal | null | undefined
      ? Prisma.Decimal | string | number | (T[K] & (null | undefined))
      : T[K] extends Date | null | undefined
        ? Date | string | (T[K] & (null | undefined))
        : T[K] extends Array<infer U>
          ? Array<PersistenceOf<U>>
          : T[K] extends object | null | undefined
            ? PersistenceOf<T[K]>
            : T[K];
};
