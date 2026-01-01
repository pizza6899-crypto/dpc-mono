// src/modules/casino-refactor/aggregator/dc/domain/exception.ts
import { DomainException } from 'src/common/exception/domain.exception';
import { DcsResponseCode } from 'src/modules/casino/dcs/constants/dcs-response-codes';

/**
 * DC 콜백 도메인 예외 기본 클래스
 * DCS 응답 코드를 포함하여 응답 변환 시 사용
 */
export class DcCallbackException extends DomainException {
  constructor(
    message: string,
    public readonly responseCode: DcsResponseCode,
  ) {
    super(message);
    this.name = 'DcCallbackException';
  }
}

/**
 * 잘못된 시간 형식
 */
export class IncorrectTimeFormatException extends DcCallbackException {
  constructor(dateString: string) {
    super(
      `Incorrect time format: ${dateString}`,
      DcsResponseCode.INCORRECT_TIME_FORMAT,
    );
  }
}

/**
 * 잘못된 프로바이더
 */
export class IncorrectProviderException extends DcCallbackException {
  constructor(provider: string) {
    super(`Incorrect provider: ${provider}`, DcsResponseCode.INCORRECT_PROVIDER);
  }
}

/**
 * 잘못된 금액
 */
export class IncorrectAmountException extends DcCallbackException {
  constructor(amount: number | string) {
    super(`Incorrect amount: ${amount}`, DcsResponseCode.INCORRECT_AMOUNT);
  }
}

/**
 * 지원하지 않는 통화
 */
export class CurrencyNotSupportedException extends DcCallbackException {
  constructor(currency: string) {
    super(
      `Currency not supported: ${currency}`,
      DcsResponseCode.CURRENCY_NOT_SUPPORT,
    );
  }
}

/**
 * 플레이어 존재하지 않음
 */
export class PlayerNotFoundException extends DcCallbackException {
  constructor(identifier: string) {
    super(
      `Player not found: ${identifier}`,
      DcsResponseCode.PLAYER_NOT_EXIST,
    );
  }
}

/**
 * 세션 인증 실패 (토큰 불일치)
 */
export class NotLoggedInException extends DcCallbackException {
  constructor(brandUid: string) {
    super(
      `Session authentication failed, token does not match with player: ${brandUid}`,
      DcsResponseCode.NOT_LOGGED_IN,
    );
  }
}

/**
 * 게임 ID 존재하지 않음
 */
export class GameIdNotFoundException extends DcCallbackException {
  constructor(gameId: number | string) {
    super(`Game id not exist: ${gameId}`, DcsResponseCode.GAME_ID_NOT_EXIST);
  }
}

/**
 * 베팅 기록 없음
 */
export class BetRecordNotFoundException extends DcCallbackException {
  constructor(identifier: string) {
    super(
      `Bet record not exist: ${identifier}`,
      DcsResponseCode.BET_RECORD_NOT_EXIST,
    );
  }
}

/**
 * 베팅 기록 중복
 */
export class BetRecordDuplicateException extends DcCallbackException {
  constructor(identifier: string) {
    super(
      `Bet record duplicate: ${identifier}`,
      DcsResponseCode.BET_RECORD_DUPLICATE,
    );
  }
}

/**
 * 잔액 부족
 */
export class BalanceInsufficientException extends DcCallbackException {
  constructor() {
    super('Balance insufficient', DcsResponseCode.BALANCE_INSUFFICIENT);
  }
}

/**
 * 잘못된 브랜드 UID
 */
export class IncorrectBrandUidException extends DcCallbackException {
  constructor(brandUid: string) {
    super(
      `Incorrect brand uid: ${brandUid}`,
      DcsResponseCode.INCORRECT_BRAND_UID,
    );
  }
}

/**
 * 시스템 오류
 */
export class SystemErrorException extends DcCallbackException {
  constructor(message?: string) {
    super(
      message || 'System error',
      DcsResponseCode.SYSTEM_ERROR,
    );
  }
}

/**
 * 알 수 없는 오류
 */
export class UnknownErrorException extends DcCallbackException {
  constructor(message?: string) {
    super(
      message || 'Unknown error',
      DcsResponseCode.UNKNOWN,
    );
  }
}

/**
 * 서명/인증 코드 오류
 */
export class SignErrorException extends DcCallbackException {
  constructor() {
    super('Sign error', DcsResponseCode.SIGN_ERROR);
  }
}

/**
 * 요청 파라미터 오류
 */
export class RequestParamErrorException extends DcCallbackException {
  constructor(missingFields?: string[]) {
    super(
      missingFields
        ? `Request param error: missing fields [${missingFields.join(', ')}]`
        : 'Request param error',
      DcsResponseCode.REQUEST_PARAM_ERROR,
    );
  }
}

/**
 * 브랜드 존재하지 않음
 */
export class BrandNotExistException extends DcCallbackException {
  constructor(brandId: string) {
    super(
      `Brand not exist: ${brandId}`,
      DcsResponseCode.BRAND_NOT_EXIST,
    );
  }
}

/**
 * 국가 코드 오류
 */
export class CountryCodeErrorException extends DcCallbackException {
  constructor(countryCode: string) {
    super(
      `Country code error: ${countryCode}`,
      DcsResponseCode.COUNTRY_CODE_ERROR,
    );
  }
}

/**
 * 차단된 플레이어
 */
export class PlayerBlockedException extends DcCallbackException {
  constructor(brandUid: string) {
    super(
      `Player blocked: ${brandUid}`,
      DcsResponseCode.PLAYER_BLOCKED,
    );
  }
}

/**
 * API 권한 부족
 */
export class ApiInsufficientPermissionException extends DcCallbackException {
  constructor() {
    super(
      'Api insufficient permission',
      DcsResponseCode.API_INSUFFICIENT_PERMISSION,
    );
  }
}

/**
 * 프로바이더 점검 중
 */
export class ProviderMaintainingException extends DcCallbackException {
  constructor(provider?: string) {
    super(
      provider
        ? `Provider is maintaining: ${provider}`
        : 'Provider is maintaining',
      DcsResponseCode.PROVIDER_MAINTAINING,
    );
  }
}

/**
 * 브랜드 잠금
 */
export class BrandLockedException extends DcCallbackException {
  constructor(brandId: string) {
    super(
      `Brand locked: ${brandId}`,
      DcsResponseCode.BRAND_LOCKED,
    );
  }
}

/**
 * 체험 게임 미지원
 */
export class NoSupportTryGameException extends DcCallbackException {
  constructor() {
    super(
      'No support try game',
      DcsResponseCode.NO_SUPPORT_TRY_GAME,
    );
  }
}

/**
 * 리플레이 미지원
 */
export class NoSupportGetReplayException extends DcCallbackException {
  constructor() {
    super(
      'No support get replay',
      DcsResponseCode.NO_SUPPORT_GET_REPLAY,
    );
  }
}

/**
 * 토큰 사용 불가
 */
export class TokenCannotBeUsedException extends DcCallbackException {
  constructor(token?: string) {
    super(
      token ? `Token cannot be used: ${token}` : 'Token cannot be used',
      DcsResponseCode.TOKEN_CANNOT_BE_USED,
    );
  }
}

/**
 * 지원하지 않는 메소드
 */
export class UnsupportedMethodException extends DcCallbackException {
  constructor(method?: string) {
    super(
      method
        ? `Unsupported method: ${method}`
        : 'Unsupported method',
      DcsResponseCode.UNSUPPORTED_METHOD,
    );
  }
}

/**
 * 요청 제한 (3초당 1회)
 */
export class RequestRateLimitException extends DcCallbackException {
  constructor() {
    super(
      'Request rate limit (once every 3 seconds)',
      DcsResponseCode.REQUEST_RATE_LIMIT,
    );
  }
}

/**
 * 조회 범위 제한 (최대 24시간/6개월 이내)
 */
export class RequestDateRangeLimitException extends DcCallbackException {
  constructor() {
    super(
      'Request date range limit (max 24 hours / within 6 months)',
      DcsResponseCode.REQUEST_DATE_RANGE_LIMIT,
    );
  }
}

/**
 * 프리 스핀 ID 없음
 */
export class FreeSpinIdNotFoundException extends DcCallbackException {
  constructor(freespinId: string | number) {
    super(
      `Free spin ID not exist: ${freespinId}`,
      DcsResponseCode.FREE_SPIN_ID_NOT_EXIST,
    );
  }
}

/**
 * 스핀 횟수 오류
 */
export class IncorrectRoundCountException extends DcCallbackException {
  constructor(roundCount: number) {
    super(
      `Incorrect round count: ${roundCount}`,
      DcsResponseCode.INCORRECT_ROUND_COUNT,
    );
  }
}

/**
 * 프리 스핀 취소됨
 */
export class FreeSpinAlreadyCancelledException extends DcCallbackException {
  constructor(freespinId: string | number) {
    super(
      `Free spin already cancelled: ${freespinId}`,
      DcsResponseCode.FREE_SPIN_ALREADY_CANCELLED,
    );
  }
}

/**
 * 프리 스핀 잠김
 */
export class FreeSpinAlreadyLockedException extends DcCallbackException {
  constructor(freespinId: string | number) {
    super(
      `Free spin already locked: ${freespinId}`,
      DcsResponseCode.FREE_SPIN_ALREADY_LOCKED,
    );
  }
}

/**
 * 프로바이더 프리 스핀 미지원
 */
export class ProviderNotSupportFreeSpinException extends DcCallbackException {
  constructor(provider?: string) {
    super(
      provider
        ? `Provider does not support free spin: ${provider}`
        : 'Provider does not support free spin',
      DcsResponseCode.PROVIDER_NOT_SUPPORT_FREE_SPIN,
    );
  }
}

/**
 * 프리 스핀 설정 오류
 */
export class FreeSpinSetupErrorException extends DcCallbackException {
  constructor(message?: string) {
    super(
      message || 'Free spin setup error',
      DcsResponseCode.FREE_SPIN_SETUP_ERROR,
    );
  }
}
