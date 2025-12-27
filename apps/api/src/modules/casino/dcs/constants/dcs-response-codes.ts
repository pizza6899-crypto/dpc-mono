import { DcsResponseDataDto } from '../dtos/callback.dto';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * DCS Seamless Wallet API Response Codes
 * Reference: DCS Seamless wallet API document
 */
export enum DcsResponseCode {
  // Success
  SUCCESS = 1000,

  // System Errors
  SYSTEM_ERROR = 1001,
  UNKNOWN = 1002,

  // Validation Errors
  SIGN_ERROR = 5000,
  REQUEST_PARAM_ERROR = 5001,
  CURRENCY_NOT_SUPPORT = 5002,
  BALANCE_INSUFFICIENT = 5003,
  BRAND_NOT_EXIST = 5005,
  COUNTRY_CODE_ERROR = 5008,
  PLAYER_NOT_EXIST = 5009,
  PLAYER_BLOCKED = 5010,
  GAME_ID_NOT_EXIST = 5012,
  NOT_LOGGED_IN = 5013,
  INCORRECT_TIME_FORMAT = 5014,
  INCORRECT_PROVIDER = 5015,
  INCORRECT_AMOUNT = 5016,
  API_INSUFFICIENT_PERMISSION = 5017,
  INCORRECT_BRAND_UID = 5018,
  PROVIDER_MAINTAINING = 5019,
  BRAND_LOCKED = 5020,
  NO_SUPPORT_TRY_GAME = 5021,
  NO_SUPPORT_GET_REPLAY = 5023,
  TOKEN_CANNOT_BE_USED = 5024,
  UNSUPPORTED_METHOD = 5025,

  // Rate Limiting
  REQUEST_RATE_LIMIT = 5040,
  REQUEST_DATE_RANGE_LIMIT = 5041,

  // Bet Record Errors
  BET_RECORD_NOT_EXIST = 5042,
  BET_RECORD_DUPLICATE = 5043,

  // Free Spin Errors
  FREE_SPIN_ID_NOT_EXIST = 5070,
  INCORRECT_ROUND_COUNT = 5071,
  FREE_SPIN_ALREADY_CANCELLED = 5072,
  FREE_SPIN_ALREADY_LOCKED = 5073,
  PROVIDER_NOT_SUPPORT_FREE_SPIN = 5074,
  FREE_SPIN_SETUP_ERROR = 5075,
}

/**
 * DCS Response Code Descriptions
 */
export const DcsResponseDescriptions: Record<DcsResponseCode, string> = {
  [DcsResponseCode.SUCCESS]: 'Success',
  [DcsResponseCode.SYSTEM_ERROR]: 'System error',
  [DcsResponseCode.UNKNOWN]: 'Unknown error',
  [DcsResponseCode.SIGN_ERROR]: 'Verification code error',
  [DcsResponseCode.REQUEST_PARAM_ERROR]: 'Request parameter error',
  [DcsResponseCode.CURRENCY_NOT_SUPPORT]: 'Currency not supported',
  [DcsResponseCode.BALANCE_INSUFFICIENT]: 'Insufficient balance',
  [DcsResponseCode.BRAND_NOT_EXIST]: 'Brand does not exist',
  [DcsResponseCode.COUNTRY_CODE_ERROR]: 'Country code error',
  [DcsResponseCode.PLAYER_NOT_EXIST]:
    "Player's account or token does not exist",
  [DcsResponseCode.PLAYER_BLOCKED]: 'Player blocked',
  [DcsResponseCode.GAME_ID_NOT_EXIST]: 'Game id does not exist',
  [DcsResponseCode.NOT_LOGGED_IN]:
    'Session authentication failed, token does not match with player',
  [DcsResponseCode.INCORRECT_TIME_FORMAT]: 'Invalid time format',
  [DcsResponseCode.INCORRECT_PROVIDER]: 'Invalid provider',
  [DcsResponseCode.INCORRECT_AMOUNT]: 'Invalid amount',
  [DcsResponseCode.API_INSUFFICIENT_PERMISSION]:
    'Api has insufficient permission',
  [DcsResponseCode.INCORRECT_BRAND_UID]: 'Incorrect brand_uid',
  [DcsResponseCode.PROVIDER_MAINTAINING]: 'Provider is under maintenance',
  [DcsResponseCode.BRAND_LOCKED]: 'Brand locked',
  [DcsResponseCode.NO_SUPPORT_TRY_GAME]: 'Try game is not supported',
  [DcsResponseCode.NO_SUPPORT_GET_REPLAY]: 'Replay is not supported',
  [DcsResponseCode.TOKEN_CANNOT_BE_USED]: 'Token cannot be used',
  [DcsResponseCode.UNSUPPORTED_METHOD]: 'Unsupported method',
  [DcsResponseCode.REQUEST_RATE_LIMIT]:
    'Request limit reached, once every 3 seconds',
  [DcsResponseCode.REQUEST_DATE_RANGE_LIMIT]:
    'Request segment limit, each request segment must not exceed 24 hours, in addition, the information can be inquired only within 6 months period',
  [DcsResponseCode.BET_RECORD_NOT_EXIST]: 'Bet record does not exist',
  [DcsResponseCode.BET_RECORD_DUPLICATE]: 'Bet record is duplicated/identical',
  [DcsResponseCode.FREE_SPIN_ID_NOT_EXIST]: 'Free spin ID does not exist',
  [DcsResponseCode.INCORRECT_ROUND_COUNT]: 'Invalid spin count',
  [DcsResponseCode.FREE_SPIN_ALREADY_CANCELLED]:
    'This free spin has been cancelled',
  [DcsResponseCode.FREE_SPIN_ALREADY_LOCKED]:
    'This free spin has been locked, unable to alter',
  [DcsResponseCode.PROVIDER_NOT_SUPPORT_FREE_SPIN]:
    'This provider does not support assigning freespin to players',
  [DcsResponseCode.FREE_SPIN_SETUP_ERROR]: 'The free spin setup has an error',
};

/**
 * DCS 상태 코드를 받아서 code와 msg를 반환하는 함수
 * @param code DCS API Response Code
 * @returns { code: number, msg: string }
 */
export function getDcsResponse(
  code: DcsResponseCode,
  data?: DcsResponseDataDto | {},
): {
  code: number;
  msg: string;
  data?: DcsResponseDataDto | {};
} {
  // Decimal 객체를 number로 변환하는 헬퍼 함수
  const convertDecimalToNumber = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Decimal 객체인 경우 number로 변환
    if (obj instanceof Decimal) {
      return obj.toDecimalPlaces(6).toNumber();
    }

    // 배열인 경우 각 요소를 재귀적으로 처리
    if (Array.isArray(obj)) {
      return obj.map(convertDecimalToNumber);
    }

    // 객체인 경우 각 속성을 재귀적으로 처리
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          converted[key] = convertDecimalToNumber(obj[key]);
        }
      }
      return converted;
    }

    // 기본 타입은 그대로 반환
    return obj;
  };

  // data가 비어있는지 확인하는 함수
  const isEmpty = (obj: any): boolean => {
    if (obj === null || obj === undefined) {
      return true;
    }
    if (typeof obj === 'object') {
      return Object.keys(obj).length === 0;
    }
    return false;
  };

  const convertedData = data ? convertDecimalToNumber(data) : undefined;
  const hasData = convertedData && !isEmpty(convertedData);

  return {
    code,
    msg: DcsResponseDescriptions[code] || 'Unknown error',
    ...(hasData && { data: convertedData }),
  };
}
