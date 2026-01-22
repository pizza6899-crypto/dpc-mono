import { GameRound } from "../../domain/model/game-round.entity";
import { GameAggregatorType } from "@prisma/client";

export interface GameRoundRepositoryPort {
    /**
     * 라운드 정보를 저장/생성합니다. (V2)
     */
    save(gameRound: GameRound): Promise<GameRound>;

    /**
     * 라운드 ID와 시작 시간을 통해 라운드를 조회합니다. (파티셔닝 고려)
     */
    findById(id: bigint, startedAt: Date): Promise<GameRound | null>;

    /**
     * 외부(애그리게이터) 라운드 ID를 통해 조회합니다.
     */
    findByExternalId(externalRoundId: string, aggregatorType: GameAggregatorType, startedAt: Date): Promise<GameRound | null>;

    /**
     * 라운드의 통계(Bet/Win)를 업데이트합니다.
     */
    updateStats(id: bigint, startedAt: Date, stats: {
        totalBetAmount?: number;
        totalWinAmount?: number;
        totalGameBetAmount?: number;
        totalGameWinAmount?: number;
    }): Promise<void>;
}
