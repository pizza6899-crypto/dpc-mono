import { Language } from '@repo/database';
import { AggregatorGameDto } from "./aggregator-game.dto";

export interface AggregatorClientPort {
    /**
     * 게임 목록 검색
     * 
     * @param language - 조회할 언어 (WC: 필수 - 언어별 API 호출, DCS: 무시 - 모든 언어 한번에 반환)
     * @returns 통합된 게임 정보 목록
     * 
     * @example
     * // WC: 언어별로 다른 게임 이름 반환
     * const koGames = await wcAdapter.fetchGameList(Language.KO);
     * const enGames = await wcAdapter.fetchGameList(Language.EN);
     * 
     * // DCS: 언어 무관하게 동일 결과 (영어 이름만 반환)
     * const games = await dcsAdapter.fetchGameList();
     */
    fetchGameList(language?: Language): Promise<AggregatorGameDto[]>;
}

