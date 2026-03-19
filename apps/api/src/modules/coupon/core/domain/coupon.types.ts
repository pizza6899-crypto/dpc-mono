import { Language } from '@prisma/client';

export type TranslationRecord = Partial<Record<Language, string>>;

/**
 * 쿠폰 메타데이터 구조 (i18n 지원)
 */
export class CouponMetadata {
  title: TranslationRecord;
  description: TranslationRecord;
}
