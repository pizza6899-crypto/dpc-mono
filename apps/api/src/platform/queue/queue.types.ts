export interface QueueJobData {
  [key: string]: any;
}

export interface QueueJobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: number | boolean;
  removeOnFail?: number | boolean;
}

export interface QueueJobResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Whitecliff 게임 관련 데이터 타입들
export interface WhitecliffFetchGameResultUrlData {
  gameRoundId: string;
}

// DCS 게임 리플레이 URL 조회 데이터 타입
export interface DcsFetchGameReplayUrlData {
  gameRoundId: string;
}

// 게임 후처리 관련 데이터 타입
export interface GamePostProcessData {
  gameRoundId: string;
  waitForPushBet: boolean; // 푸시 베팅 완료 대기 여부
}

export enum QueueNames {
  // Whitecliff 관련 큐들
  WHITECLIFF_FETCH_GAME_RESULT_URL = 'whitecliff-fetch-game-result-url',

  // DCS 관련 큐들
  DCS_FETCH_GAME_REPLAY_URL = 'dcs-fetch-game-replay-url',

  // 게임 후처리 큐 (모든 게임사 공통)
  GAME_POST_PROCESS = 'game-post-process',
}
