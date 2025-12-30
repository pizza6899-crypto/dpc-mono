import { HttpStatus } from '@nestjs/common';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import { Language } from '@repo/database';

// src/utils/language.util.ts
export function toLanguageEnum(code: string): Language {
  const normalized = code.toLowerCase().trim();

  const languageMap: Record<string, Language> = {
    en: Language.EN,
    ko: Language.KO,
    ja: Language.JA,
  };

  const language = languageMap[normalized];

  if (!language) {
    throw new ApiException(
      MessageCode.INVALID_LANGUAGE_CODE,
      HttpStatus.BAD_REQUEST,
    );
  }

  return language;
}

export function fromLanguageEnum(
  language: Language | null | undefined,
): string {
  if (!language) {
    return 'en';
  }

  const codeMap: Record<Language, string> = {
    [Language.EN]: 'en',
    [Language.KO]: 'ko',
    [Language.JA]: 'ja',
  };

  return codeMap[language] || 'en';
}
