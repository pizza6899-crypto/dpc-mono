import { CASINO_QUEUES } from '../casino.bullmq';

// 게임 후처리 관련 데이터 타입
export interface GamePostProcessData {
  gameRoundId: string;
}

// 통합 게임 결과 조회 데이터 타입
export interface GameResultFetchData {
  gameRoundId: string; // BigInt serialized string
}

export const CasinoQueueNames = {
  // 게임 후처리 큐 (모든 게임사 공통)
  GAME_POST_PROCESS: CASINO_QUEUES.GAME_POST_PROCESS.name,

  // 통합 게임 결과/리플레이 조회 큐
  GAME_RESULT_FETCH: CASINO_QUEUES.GAME_RESULT_FETCH.name,
} as const;
