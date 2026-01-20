import { CasinoErrorCode } from "src/modules/casino/constants/casino-error-codes";

/**
 * 예외를 분석하여 적절한 CasinoErrorCode 반환
 */
export function getCasinoErrorCode(error: unknown): string {
  // Error 객체인 경우 message 확인
  if (error instanceof Error) {
    const errorMessage = error.message;

    switch (errorMessage) {
      case CasinoErrorCode.PARAMETER_MISSING:
      case CasinoErrorCode.INVALID_USER:
      case CasinoErrorCode.USER_BALANCE_NOT_FOUND:
        return 'INVALID_USER';

      case CasinoErrorCode.INSUFFICIENT_FUNDS:
        return 'INSUFFICIENT_FUNDS';

      case CasinoErrorCode.INVALID_TXN:
      case CasinoErrorCode.DUPLICATE_DEBIT:
        return 'DUPLICATE_DEBIT';

      case CasinoErrorCode.BET_ALREADY_CANCELLED:
        return 'BET_ALREADY_CANCELLED';

      case CasinoErrorCode.BONUS_ALREADY_PROCESSED:
        return 'DUPLICATE_BONUS';

      case CasinoErrorCode.INVALID_PRODUCT:
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  // 문자열인 경우 직접 비교
  if (typeof error === 'string') {
    switch (error) {
      case CasinoErrorCode.PARAMETER_MISSING:
      case CasinoErrorCode.INVALID_USER:
        return 'INVALID_USER';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  return 'UNKNOWN_ERROR';
}
