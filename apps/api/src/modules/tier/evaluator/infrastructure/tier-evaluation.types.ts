export enum TierEvaluationJobType {
    TRIGGER_ALL = 'TRIGGER_ALL',
    EVALUATE_USER = 'EVALUATE_USER',
}

export interface TierEvaluationJobPayload {
    type: TierEvaluationJobType;
    data?: {
        userId?: string; // bigint string
    };
}
