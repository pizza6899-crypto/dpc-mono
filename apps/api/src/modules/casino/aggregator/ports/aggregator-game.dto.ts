import { GameAggregatorType } from '@repo/database';

/**
 * Aggregator로부터 받아오는 게임 정보를 표준화한 DTO
 * 각 Aggregator Adapter에서 이 형식으로 변환하여 반환합니다.
 * 
 * Raw 필드: 외부 API 원본값 (string) - Adapter가 그대로 전달
 * Normalized 필드: 내부 표준값 (enum/boolean 등) - Sync Service에서 매핑 후 사용
 */
export interface AggregatorGameDto {
    // ===== 필수 (모든 aggregator) =====
    /** 
     * 프로바이더 표시명 (Raw)
     * @example "Evolution Asia", "Play'n GO", "Pragmatic Play"
     */
    providerName: string;

    /** 게임 이름 */
    gameName: string;

    /** 
     * 게임 식별 코드 (각사 고유 ID를 string으로 변환)
     * @example "12345", "160000"
     */
    gameCode: string;

    // ===== Provider/Category 매핑용 (Raw) =====
    /** 
     * 프로바이더 코드 (Raw) - Provider 매칭에 사용
     * @example WC: "1", "28", "226" (prd_id)
     * @example DCS: "png", "evo" (provider)
     */
    providerCode?: string;

    /** 
     * 카테고리 (Raw)
     * @example WC: "Live Casino", "Slot"
     * @example DCS: "Standard"
     */
    category?: string;

    // ===== 게임 상세 정보 =====
    /** 
     * 게임 타입 (Raw)
     * @example WC Live: "Baccarat", "Blackjack", "andarbahar"
     * @example DCS Slot: "5-Reel Slot Machine", "3-Reel Slot Machine"
     */
    gameType?: string;

    /** 
     * 썸네일/아이콘 URL
     * @example "https://storage.dc-ace.com/.../game.png"
     */
    iconUrl?: string;

    // ===== WC 전용 =====
    /** 
     * 테이블 ID (WC 라이브 카지노 전용)
     * @example "qfn3vbbcaaw32fy6", "LightningBac0001"
     */
    tableId?: string | null;

    /** 
     * 활성화 여부 (WC: is_enabled)
     */
    isEnabled?: boolean;
}

/**
 * GameAggregatorType → DB Aggregator Code 매핑
 * Sync Service에서 aggregator를 DB에서 조회할 때 사용
 */
export const AGGREGATOR_CODE_MAP: Record<GameAggregatorType, string> = {
    [GameAggregatorType.WHITECLIFF]: 'WC',
    [GameAggregatorType.DCS]: 'DCS',
};

/**
 * Whitecliff Provider ID → 내부 Provider 코드 매핑
 * Sync Service에서 providerCode를 GameProvider enum으로 변환할 때 사용
 */
export const WC_PROVIDER_MAP: Record<string, string> = {
    '1': 'EVOLUTION_ASIA',            // Evolution Asia
    '28': 'PRAGMATIC_PLAY_LIVE', // Pragmatic Play Live
    '29': 'EVOLUTION_INDIA',
    '31': 'EVOLUTION_KOREA',
    '226': 'PRAGMATIC_PLAY_SLOTS', // Pragmatic Play Slots
};

/**
 * DCS Provider Code → 내부 Provider 코드 매핑
 * 
 * 현재 GameProvider enum에 정의된 프로바이더만 매핑됨:
 * EVOLUTION, PRAGMATIC_PLAY_LIVE, PG_SOFT, PRAGMATIC_PLAY_SLOTS, RELAX_GAMING, PLAYNGO
 * 
 * 나머지 프로바이더는 DB enum 추가 후 매핑 가능
 */
export const DCS_PROVIDER_MAP: Record<string, string> = {
    // ===== 현재 지원되는 프로바이더 =====
    'png': 'PLAYNGO',              // Play'n Go
    'evl': 'EVOLUTION',            // Evolution
    'relax': 'RELAX_GAMING',       // Relax gaming
    // 'pgs': 'PG_SOFT',           // PG Soft (DCS 코드 확인 필요)
    // 'pp': 'PRAGMATIC_PLAY_SLOTS', // Pragmatic Play (Live/Slot 구분 필요)

    // ===== DB enum 추가 필요 (주석 처리) =====
    // 'ne': 'NETENT',             // NetEnt
    // 'rt': 'RED_TIGER',          // Red Tiger
    // 'tg': 'TURBO_GAMES',        // Turbo Games
    // 'tgo': 'TURBO_GAMES_NON_ASIAN', // Turbo Games (non-Asian market)
    // 'wz': 'WAZDAN',             // Voltent (Wazdan)
    // 'tk': 'THUNDERKICK',        // Thunderkick
    // 'lm': 'LUCKY_MONACO',       // Lucky Monaco
    // 'yt': 'YOLTED',             // Yolted
    // 'sa': 'SA_GAMING',          // SA Gaming
    // 'ss': 'SMARTSOFT',          // Smartsoft
    // 'bg': 'BGAMING',            // Bgaming
    // 'nm': 'NOVOMATIC',          // Novomatic
    // 'op': 'OCTOPLAY',           // Octoplay
    // 'bp': 'BLUEPRINT',          // BluePrint
    // 'hso': 'HACKSAW_ROW',       // Hacksaw Gaming ROW
    // 'hsl': 'HACKSAW_LATAM',     // Hacksaw Gaming Latam
    // 'hs': 'HACKSAW',            // Hacksaw Gaming
    // 'tq': 'ORIGINALS',          // Originals (Tequity)
    // 'raw': 'RAW',               // RAW
    // 'bm': 'BOOMING_GAMES',      // Booming Games
    // 'ag': 'PLAYACE',            // PlayACE
    // 'pts': 'PLAYTECH_SLOT',     // Play Tech Slot
    // 'ptc': 'PLAYTECH_CASINO',   // PlayTech Casino
    // 'dcace': 'DCACE',           // DCACE
    // 'yg': 'YGGDRASIL',          // Yggdrasil
    // 'nlc': 'NOLIMIT_CITY',      // Nolimit City
    // 'aux': 'AVATAR_UX',         // Avatar UX
    // 'evo': 'EVOPLAY',           // Evoplay (주의: evl과 다름)
    // 'gam': 'GAMOMAT',           // Gamomat
    // 'psh': 'PUSH_GAMING',       // Push Gaming
    // 'ezugi': 'EZUGI',           // Ezugi
    // 'swf': 'WIN_FAST',          // Win Fast
    // 'funta': 'FUNTA_GAMING',    // FunTa Gaming
    // 'stm': 'SLOTMILL',          // Slotmill
    // 'mj': 'SEVEN_MOJOS',        // 7Mojos
    // 'fm': 'FANTASMA',           // Fantasma
    // 'ps': 'PETER_AND_SONS',     // Peter & Sons
    // 'sb': 'SPRIBE',             // Spribe
    // 'plb': 'PARLAY_BAY',        // Parlay bay
    // 'btg': 'BIG_TIME_GAMING',   // Big Time Gaming
};

/**
 * Raw Category → GameCategory enum 매핑
 */
export const CATEGORY_MAP: Record<string, string> = {
    'Live Casino': 'LIVE_CASINO',
    'Slot': 'SLOTS',
    'Slots': 'SLOTS',
    'Standard': 'SLOTS', // DCS Standard는 대부분 슬롯
};
