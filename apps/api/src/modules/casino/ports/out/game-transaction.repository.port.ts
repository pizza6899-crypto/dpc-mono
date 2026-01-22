import { GameTransactionType } from "@prisma/client";
import { GameTransaction } from "../../domain/model/game-transaction.entity";

export interface GameTransactionRepositoryPort {
    /**
     * 게임 트랜잭션을 저장/생성합니다. (V2)
     */
    save(transaction: GameTransaction): Promise<GameTransaction>;

    /**
     * 트랜잭션 ID와 부모 라운드 시작 시간을 통해 트랜잭션을 조회합니다. (파티셔닝 고려)
     */
    findById(id: bigint, roundStartedAt: Date): Promise<GameTransaction | null>;

    /**
     * 외부 트랜잭션 ID와 타입을 통해 조회합니다. (중복 처리 방지용)
     */
    findByExternalId(aggregatorTxId: string, type: GameTransactionType, roundStartedAt: Date): Promise<GameTransaction | null>;

    /**
     * 특정 라운드에 속한 모든 트랜잭션을 조회합니다.
     */
    findAllByRoundId(gameRoundId: bigint, roundStartedAt: Date): Promise<GameTransaction[]>;
}
