// src/modules/casino-refactor/aggregator/wc/utils/wc-response.util.ts
import type {
  WhitecliffGameListResponse,
  WhitecliffErrorResponse,
  WhitecliffGameLaunchResponse,
} from '../ports/out/wc-aggregator-api.port';

/**
 * Whitecliff API 응답 타입 가드
 */
export function isWhitecliffGameListResponse(
  response: WhitecliffGameListResponse | WhitecliffErrorResponse,
): response is WhitecliffGameListResponse {
  return 'game_list' in response && response.status === 1;
}

/**
 * Whitecliff API 에러 응답 타입 가드
 */
export function isWhitecliffErrorResponse(
  response: WhitecliffGameListResponse | WhitecliffErrorResponse,
): response is WhitecliffErrorResponse {
  return 'error' in response && response.status === 0;
}

/**
 * Whitecliff 게임 실행 성공 응답 타입 가드
 */
export function isWhitecliffGameLaunchResponse(
  response: WhitecliffGameLaunchResponse | WhitecliffErrorResponse,
): response is WhitecliffGameLaunchResponse {
  return 'launch_url' in response && response.status === 1;
}

