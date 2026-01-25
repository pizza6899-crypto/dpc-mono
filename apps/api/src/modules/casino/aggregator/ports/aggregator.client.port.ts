import { AggregatorGameDto } from "./aggregator-game.dto";

export interface AggregatorClientPort {
    /**
     * 게임 목록 검색
     * 
     * @param useMock Mock 데이터 사용 여부
     * @returns 통합된 게임 정보 목록 (기본 언어 - 영어)
     */
    fetchGameList(useMock?: boolean): Promise<AggregatorGameDto[]>;
}

