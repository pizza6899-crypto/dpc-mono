import { TierHistory } from "../domain";

export interface TierHistoryRepositoryPort {
    create(history: TierHistory): Promise<TierHistory>;
    findByUserId(userId: bigint): Promise<TierHistory[]>;
}
