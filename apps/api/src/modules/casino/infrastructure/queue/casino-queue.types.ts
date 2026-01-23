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

// 게임 후처리 관련 데이터 타입
export interface GamePostProcessData {
    gameRoundId: string;
}

// 통합 게임 결과 조회 데이터 타입
export interface GameResultFetchData {
    gameRoundId: string; // BigInt serialized string
}

export enum CasinoQueueNames {
    // 게임 후처리 큐 (모든 게임사 공통)
    GAME_POST_PROCESS = 'game-post-process',

    // 통합 게임 결과/리플레이 조회 큐
    GAME_RESULT_FETCH = 'game-result-fetch',
}
