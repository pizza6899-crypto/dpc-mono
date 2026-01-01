// src/modules/casino-refactor/aggregator/wc/domain/exception.ts

/**
 * WC API 예외
 *
 * Whitecliff API 관련 예외의 기본 클래스입니다.
 */
export class WcApiException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'WcApiException';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * WC 설정 예외
 *
 * Whitecliff 설정이 잘못되었을 때 발생하는 예외입니다.
 */
export class WcInvalidConfigException extends WcApiException {
  constructor(message: string) {
    super(message, 'WC_INVALID_CONFIG', 500);
    this.name = 'WcInvalidConfigException';
  }
}

/**
 * WC 통화 예외
 *
 * Whitecliff 통화가 잘못되었을 때 발생하는 예외입니다.
 */
export class WcInvalidCurrencyException extends WcApiException {
  constructor(message: string) {
    super(message, 'WC_INVALID_CURRENCY', 400);
    this.name = 'WcInvalidCurrencyException';
  }
}

/**
 * WC API 요청 실패 예외
 *
 * Whitecliff API 요청이 실패했을 때 발생하는 예외입니다.
 */
export class WcApiRequestFailedException extends WcApiException {
  constructor(
    message: string,
    public readonly originalError?: Error,
    statusCode?: number,
  ) {
    super(message, 'WC_API_REQUEST_FAILED', statusCode || 500);
    this.name = 'WcApiRequestFailedException';
  }
}

