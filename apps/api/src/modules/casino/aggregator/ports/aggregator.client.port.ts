import { AggregatorGameDto } from "./aggregator-game.dto";

export interface AggregatorClientPort {
    /**
     * 게임 목록 검색
     * @returns 통합된 게임 정보 목록
     */
    fetchGameList(): Promise<AggregatorGameDto[]>;
}
