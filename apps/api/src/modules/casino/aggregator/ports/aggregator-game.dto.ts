export interface AggregatorGameDto {
    providerName: string; // 프로바이더 이름 (예: Evolution, Pragmatic Play)
    gameName: string;     // 게임 이름
    gameCode: string;     // 게임 식별 코드 (각사 고유 ID)
    gameType?: string;    // 게임 타입 (slot, live 등)
    thumbnailUrl?: string; // 썸네일/아이콘 URL
    tableId?: string;     // 테이블 ID (라이브 카지노용)
    // 필요한 경우 추가 필드
}
