import { z } from 'zod'

/**
 * Creates a reactive validator object that can access the current i18n instance.
 * Must be called inside setup() or a composable.
 */
export const useValidators = () => {
    const { t } = useI18n()

    return {
        email: z.string().email(t('validation.email')),

        // Password: Min 8, Max 20, at least 1 letter and 1 number
        password: z.string()
            .min(8, t('validation.min_length', { min: 8, field: t('login.password') }))
            .max(20, t('validation.max_length', { max: 20, field: t('login.password') }))
            .regex(/^(?=.*[a-z])(?=.*\d).+$/, t('validation.password_complexity')),

        referralCode: z.string()
            .min(6, t('validation.min_length', { min: 6, field: t('users.referral_code') }))
            .max(20, t('validation.max_length', { max: 20, field: t('users.referral_code') }))
            .optional()
            .or(z.literal('')),

        countryCode: z.string()
            .length(2, t('validation.exact_length', { length: 2, field: t('users.country') }))
            .optional()
            .or(z.literal('')),

        timezone: z.string()
            .optional()
            .or(z.literal('')),

        required: (label?: string) =>
            z.string().min(1, label ? t('validation.required_field', { field: label }) : t('validation.required')),

        minLength: (min: number, label?: string) =>
            z.string().min(min, t('validation.min_length', { min, field: label || t('common.field') })),

        maxLength: (max: number, label?: string) =>
            z.string().max(max, t('validation.max_length', { max, field: label || t('common.field') })),

        fixedLength: (length: number, label?: string) =>
            z.string().length(length, t('validation.exact_length', { length, field: label || t('common.field') })),

        optionalText: z.string().optional()
    }
}
