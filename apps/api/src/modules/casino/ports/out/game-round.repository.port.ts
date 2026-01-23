import { GameRound, GameResultMeta } from "../../domain/model/game-round.entity";
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
     * 특정 시간 범위 내에서 외부 라운드 ID를 통해 조회합니다. (재시도 시 가변적인 시간 대응)
     */
    findByExternalIdWithWindow(externalRoundId: string, aggregatorType: GameAggregatorType, referenceTime: Date, windowHours?: number): Promise<GameRound | null>;

    /**
     * 시간 정보 없이 외부 라운드 ID로 가장 최근 라운드를 조회합니다.
     */
    findLatestByExternalId(externalRoundId: string, aggregatorType: GameAggregatorType): Promise<GameRound | null>;

    /**
     * 라운드의 통계를 원자적(Atomic)으로 증가시킵니다.
     * 동시성 문제 해결을 위해 값을 덮어쓰지 않고 increment 연산을 사용합니다.
     */
    increaseStats(id: bigint, startedAt: Date, delta: {
        betAmount?: Prisma.Decimal;
        winAmount?: Prisma.Decimal;
        gameBetAmount?: Prisma.Decimal;
        gameWinAmount?: Prisma.Decimal;
        refundAmount?: Prisma.Decimal;
        gameRefundAmount?: Prisma.Decimal;
        jackpotAmount?: Prisma.Decimal;
        gameJackpotAmount?: Prisma.Decimal;
        compEarned?: Prisma.Decimal;
        jackpotContributionAmount?: Prisma.Decimal;
    }): Promise<void>;


    /**
     * 라운드의 결과 메타데이터(URL, Replay 등)를 업데이트합니다.
     */
    updateResultMeta(id: bigint, startedAt: Date, meta: GameResultMeta): Promise<void>;

    /**
     * 라운드의 푸시(환불) 검증 여부를 체크 완료로 마킹합니다.
     */
    markPushedBetChecked(id_startedAt: { id: bigint; startedAt: Date }[]): Promise<void>;
}
