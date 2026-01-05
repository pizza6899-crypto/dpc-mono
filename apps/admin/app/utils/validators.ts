import { z } from 'zod'

/**
 * Creates a reactive validator object that can access the current i18n instance.
 * Must be called inside setup() or a composable.
 */
export const useValidators = () => {
    const { t } = useI18n()

    // --- [1] 기본 원자적 검증기 (Base Atom) ---
    // 반복되는 에러 메시지(필수 입력, 타입 오류 등)를 중앙에서 관리합니다.
    const createBase = (label?: string) => ({
        string: z.string({
            message: t('validation.required_field', { field: label || t('common.field') })
        }),
        number: z.number({
            message: t('validation.required_field', { field: label || t('common.field') })
        })
    })

    // --- [2] 도메인 특화 검증기 (Domain Specific) ---
    return {
        // Base Primitive Helpers
        string: (label?: string) => createBase(label).string,
        number: (label?: string) => createBase(label).number,

        // Common Validators
        email: (label?: string) => createBase(label).string.email(t('validation.email')),

        password: (label?: string) => createBase(label).string
            .min(8, t('validation.min_length', { min: 8, field: label || t('common.field') }))
            .max(20, t('validation.max_length', { max: 20, field: label || t('common.field') }))
            .regex(/^(?=.*[a-z])(?=.*\d).+$/, t('validation.password_complexity')),

        referralCode: (label?: string) => createBase(label).string
            .min(6, t('validation.min_length', { min: 6, field: label || t('common.field') }))
            .max(20, t('validation.max_length', { max: 20, field: label || t('common.field') }))
            .optional()
            .or(z.literal('')),

        countryCode: (label?: string) => createBase(label).string
            .length(2, t('validation.exact_length', { length: 2, field: label || t('common.field') }))
            .optional()
            .or(z.literal('')),

        timezone: (label?: string) => z.string() // Timezone usually comes from select, strict validation might not be needed or handled by select options
            .optional()
            .or(z.literal('')),

        // Custom Domain Validators
        tierCode: (label?: string) => createBase(label).string
            .regex(/^[A-Z0-9_]+$/, t('validation.invalid_format'))
            .min(1, t('validation.required_field', { field: label || t('common.field') })),

        // --- Helpers ---

        // String Generic Helpers
        required: (label?: string) =>
            createBase(label).string.min(1, t('validation.required_field', { field: label || t('common.field') })),

        minLength: (min: number, label?: string) =>
            createBase(label).string.min(min, t('validation.min_length', { min, field: label || t('common.field') })),

        maxLength: (max: number, label?: string) =>
            createBase(label).string.max(max, t('validation.max_length', { max, field: label || t('common.field') })),

        fixedLength: (length: number, label?: string) =>
            createBase(label).string.length(length, t('validation.exact_length', { length, field: label || t('common.field') })),

        optionalText: z.string().optional(),

        // Number Generic Helpers
        requiredNumber: (label?: string) =>
            createBase(label).number
                .min(0, t('validation.required_field', { field: label || t('common.field') })),

        minNumber: (min: number, label?: string) =>
            createBase(label).number
                .min(min, t('validation.min_value', { min, field: label || t('common.field') })),

        percentage: (label?: string) =>
            createBase(label).number
                .min(0, t('validation.min_value', { min: 0, field: label || t('common.field') }))
                .max(100, t('validation.max_value', { max: 100, field: label || t('common.field') }))
                .optional()
                .default(0)
    }
}
