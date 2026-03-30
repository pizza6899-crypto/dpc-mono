/**
 * 통합 로그의 서비스 분류 (Service / Module)
 * 도메인 접두사를 포함할 수 있습니다 (예: game-artifact)
 */
export type LogService =
  | 'artifact';

/**
 * 통합 로그의 소분류 (Event / Action)
 * 모든 서비스에서 공통으로 또는 개별적으로 발생하는 구체적 행위입니다.
 */
export type LogEvent =
  | 'draw' | 'reward';