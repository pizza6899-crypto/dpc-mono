import { TierHistory } from "../domain/model/tier-history.entity";

export interface TierHistoryWithRelations extends TierHistory {
    userEmail: string;
    oldTierCode: string | null;
    newTierCode: string;
}

export interface FindTierHistoryIsParams {
    userId?: bigint;
    page: number;
    limit: number;
}

export interface FindTierHistoryResult {
    items: TierHistoryWithRelations[];
    total: number;
}

export interface TierHistoryRepositoryPort {
    findHistory(params: FindTierHistoryIsParams): Promise<FindTierHistoryResult>;
    create(history: TierHistory): Promise<TierHistory>;
}
