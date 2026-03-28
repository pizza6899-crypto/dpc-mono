/**
 * 통합 로그의 서비스 분류 (Service / Module)
 * 도메인 접두사를 포함할 수 있습니다 (예: game-artifact)
 */
export type LogService =
  | 'artifact'
  | 'casino'
  | 'deposit'
  | 'withdrawal'
  | 'wallet'
  | 'auth'
  | 'user'
  | 'coupon'
  | 'chat'
  | 'intelligence'
  | 'system-batch';

/**
 * 통합 로그의 소분류 (Event / Action)
 * 모든 서비스에서 공통으로 또는 개별적으로 발생하는 구체적 행위입니다.
 */
export type LogEvent =
  // 1. 공통 CRUD 및 상태 변경
  | 'create' | 'update' | 'delete' | 'change' | 'init'

  // 2. 금융/트랜잭션 (Finance/Transaction)
  | 'request' | 'approve' | 'reject' | 'process' | 'cancel' | 'refund' | 'transfer' | 'adjust'

  // 3. 게임/콘텐츠 (Game/Content)
  | 'draw' | 'synthesize' | 'upgrade' | 'equip' | 'round_start' | 'round_end' | 'use'

  // 4. 인증/회원 (Auth/User)
  | 'signup' | 'login' | 'logout' | 'kick' | 'ban' | 'revoke'

  // 5. 시스템/배치 (System/Batch)
  | 'start' | 'success' | 'fail' | 'complete' | 'configure' | 'other';
