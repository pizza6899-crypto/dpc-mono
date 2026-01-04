import { z } from 'zod'

/**
 * Creates a reactive validator object that can access the current i18n instance.
 * Must be called inside setup() or a composable.
 */
export const useValidators = () => {
    const { t } = useI18n()

    return {
        email: z.string().email(t('validation.email')),

        password: z.string().min(8, t('validation.password')),

        required: (label?: string) =>
            z.string().min(1, label ? t('validation.required_field', { field: label }) : t('validation.required')),

        stringMin: (min: number, label?: string) =>
            z.string().min(min, t('validation.min_length', { min, field: label || t('common.field') })),

        exactLength: (length: number, label?: string) =>
            z.string().length(length, t('validation.exact_length', { length, field: label || t('common.field') })),

        optionalString: z.string().optional()
    }
}
