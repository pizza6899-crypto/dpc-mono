import { CasinoQueueNames } from './casino-queue.types';

export const CASINO_QUEUE_CONFIGS = {
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
    [CasinoQueueNames.GAME_RESULT_FETCH]: {
        attempts: 10,
        delay: 5000,
        backoff: {
            type: 'fixed' as const,
            delay: 5000,
        },
    },
} as const;
