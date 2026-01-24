import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import {
    CasinoQueueNames,
    QueueJobOptions,
    GamePostProcessData,
    GameResultFetchData,
} from './casino-queue.types';
import { GameResultFetchPolicy } from './processors/game-result-fetch.processor';
import { GamePostProcessPolicy } from './processors/game-post-process.processor';

@Injectable()
export class CasinoQueueService {
    private readonly logger = new Logger(CasinoQueueService.name);

    constructor(
        @InjectQueue(CasinoQueueNames.GAME_POST_PROCESS)
        private gamePostProcessQueue: Queue,
        @InjectQueue(CasinoQueueNames.GAME_RESULT_FETCH)
        private gameResultFetchQueue: Queue,
    ) { }

    /**
     * 통합 게임 결과/리플레이 조회 큐에 작업 추가
     */
    async addGameResultFetchJob(
        data: GameResultFetchData,
        options?: QueueJobOptions,
    ): Promise<Job> {
        const config = GameResultFetchPolicy;
        const jobOptions = {
            ...config,
            ...options,
        };

        const job = await this.gameResultFetchQueue.add(
            'process-fetch-game-result',
            data,
            jobOptions,
        );
        this.logger.log(
            `Game result fetch job added: ${job.id} - round=${data.gameRoundId}`,
        );
        return job;
    }

    /**
     * 게임 후처리 큐에 작업 추가
     * 콤프, 롤링, VIP 레벨 등 처리
     */
    async addGamePostProcessJob(
        data: GamePostProcessData,
        options?: QueueJobOptions,
    ): Promise<Job> {
        const config = GamePostProcessPolicy;
        const jobOptions = {
            ...config,
            ...options,
        };

        const job = await this.gamePostProcessQueue.add(
            'process-game-post',
            data,
            jobOptions,
        );
        this.logger.log(
            `Game post process job added: ${job.id} - gameRoundId=${data.gameRoundId}`,
        );
        return job;
    }

    /**
     * 큐 상태 조회
     */
    async getQueueStatus(queueName: CasinoQueueNames) {
        const queue = this.getQueueByName(queueName);
        if (!queue) return null;

        const [waiting, active, completed, failed] = await Promise.all([
            queue.getWaiting(),
            queue.getActive(),
            queue.getCompleted(),
            queue.getFailed(),
        ]);

        return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
        };
    }

    /**
     * 큐 이름으로 큐 인스턴스 가져오기
     */
    private getQueueByName(queueName: CasinoQueueNames): Queue | null {
        switch (queueName) {
            case CasinoQueueNames.GAME_POST_PROCESS:
                return this.gamePostProcessQueue;
            case CasinoQueueNames.GAME_RESULT_FETCH:
                return this.gameResultFetchQueue;
            default:
                return null;
        }
    }
}

