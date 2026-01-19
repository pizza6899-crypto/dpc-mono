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
    thumbnailUrl?: string;

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
 * Whitecliff Provider ID → 내부 Provider 코드 매핑
 * Sync Service에서 providerCode를 GameProvider enum으로 변환할 때 사용
 */
export const WC_PROVIDER_MAP: Record<string, string> = {
    '1': 'EVOLUTION',           // Evolution Asia
    '28': 'PRAGMATIC_PLAY_LIVE', // Pragmatic Play Live
    '29': 'EVOLUTION',           // Evolution India (-> EVOLUTION으로 통합)
    '31': 'EVOLUTION',           // Evolution Korea (-> EVOLUTION으로 통합)
    '226': 'PRAGMATIC_PLAY_SLOTS', // Pragmatic Play Slots
};

/**
 * DCS Provider Code → 내부 Provider 코드 매핑
 */
export const DCS_PROVIDER_MAP: Record<string, string> = {
    'png': 'PLAYNGO',
    'evo': 'EVOLUTION',
    // 추가 매핑...
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
