import { TierTranslationDtoLanguage } from '~/api/generated/models'

export interface LanguageOption {
    code: TierTranslationDtoLanguage
    label: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
    { code: TierTranslationDtoLanguage.EN, label: 'English' },
    { code: TierTranslationDtoLanguage.KO, label: 'Korean' },
    { code: TierTranslationDtoLanguage.JA, label: 'Japanese' }
]

export const getLanguageLabel = (code: string) => {
    return SUPPORTED_LANGUAGES.find(l => l.code === code)?.label || code
}
