import { CasinoQueueNames } from './casino-queue.types';

export const CASINO_QUEUE_CONFIGS = {
    [CasinoQueueNames.WHITECLIFF_FETCH_GAME_RESULT_URL]: {
        attempts: 5,
        delay: 5000,
        backoff: {
            type: 'exponential' as const,
            delay: 3000,
        },
    },
    [CasinoQueueNames.DCS_FETCH_GAME_REPLAY_URL]: {
        attempts: 5,
        delay: 5000,
        backoff: {
            type: 'exponential' as const,
            delay: 3000,
        },
    },
    [CasinoQueueNames.GAME_POST_PROCESS]: {
        // 무제한 시도
        // 고정 5초 간격
        attempts: 999999,
        delay: 5000,
        backoff: {
            type: 'fixed' as const,
            delay: 5000,
        },
    },
} as const;
