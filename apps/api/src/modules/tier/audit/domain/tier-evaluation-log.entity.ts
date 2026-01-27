import { EvaluationStatus } from '@prisma/client';

export class TierEvaluationLog {
    constructor(
        public readonly id: bigint,
        public readonly startedAt: Date,
        public readonly finishedAt: Date | null,
        public readonly status: EvaluationStatus,

        // Metrics
        public readonly totalProcessedCount: number,
        public readonly promotedCount: number,
        public readonly demotedCount: number,
        public readonly gracePeriodCount: number,
        public readonly maintainedCount: number,
        public readonly skippedBonusCount: number,

        public readonly errorMessage: string | null,
    ) { }

    static fromPersistence(data: any): TierEvaluationLog {
        return new TierEvaluationLog(
            data.id,
            data.startedAt,
            data.finishedAt,
            data.status as EvaluationStatus,
            data.totalProcessedCount,
            data.promotedCount,
            data.demotedCount,
            data.gracePeriodCount,
            data.maintainedCount,
            data.skippedBonusCount,
            data.errorMessage
        );
    }
}
