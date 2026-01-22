import { GameRound } from "../../domain/model/game-round.entity";
import { GameAggregatorType, Prisma } from "@prisma/client";

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
     * 라운드의 통계를 원자적(Atomic)으로 증가시킵니다.
     * 동시성 문제 해결을 위해 값을 덮어쓰지 않고 increment 연산을 사용합니다.
     */
    increaseStats(id: bigint, startedAt: Date, delta: {
        betAmount?: Prisma.Decimal;
        winAmount?: Prisma.Decimal;
        gameBetAmount?: Prisma.Decimal;
        gameWinAmount?: Prisma.Decimal;
    }): Promise<void>;
}
