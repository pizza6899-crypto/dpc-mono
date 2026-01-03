import { MessageCode } from '../constants/message-codes';

export const ErrorI18nMap: Record<MessageCode, string> = {
    // Example mapping
    [MessageCode.DEPOSIT_AMOUNT_BELOW_MINIMUM]: 'errors.deposit.amount_below_minimum',

    // Initialize other keys...
} as Record<MessageCode, string>; // Cast to ensure all keys are eventually covered or make it Partial
