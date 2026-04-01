/**
 * 1-1. 유물 뽑기 (티켓 소모)
 */
export interface ArtifactTicketDrawPayload {
  drawType: string;  // SINGLE, TEN 등
  blockhash: string;
  ticketType: string; // ALL, RARE, EPIC 등
  ticketCount: number; // 소모된 티켓 수량 (코스트)
  ticketBalanceBefore?: number;
  ticketBalanceAfter?: number;
  drawCount: number; // 총 보상 수량
  items: Array<{
    artifactCode: string; // Artifact Catalog Code
    grade: string;
    userArtifactId: string; // 생성된 UserArtifact.id (BigInt String)
    gradeRoll?: number;
    selectRoll?: number;
  }>;
}

/**
 * 1-2. 유물 뽑기 (재화 소모)
 */
export interface ArtifactCurrencyDrawPayload {
  drawType: string;
  blockhash: string;
  currencyCode: string;
  costAmount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  drawCount: number;
  items: Array<{
    artifactCode: string; // Artifact Catalog Code
    grade: string;
    userArtifactId: string;
    gradeRoll?: number;
    selectRoll?: number;
  }>;
}

/**
 * 2. 유물 장착
 */
export interface ArtifactEquipPayload {
  userArtifactId: string; // BigInt String (Sqid 아님)
  artifactCode: string;
  slotNo: number;
  prevArtifactCode?: string | null;   // 교체된 기존 유물 코드
  prevUserArtifactId?: string | null; // 교체된 기존 유물의 PK (BigInt String)
}

/**
 * 3. 유물 해제
 */
export interface ArtifactUnequipPayload {
  userArtifactId: string; // BigInt String (Sqid 아님)
  artifactCode: string;
  slotNo: number | null; // 어느 슬롯에서 해제되었는지 기록
}

/**
 * 4. 유물 합성
 */
export interface ArtifactSynthesisPayload {
  ingredients: string[]; // BigInt String 배열 (Sqid 아님)
  ingredientCodes: string[];
  baseGrade: string;
  isSuccess: boolean;
  isGuaranteed: boolean;
  rewardArtifactCode: string;
  rewardGrade: string;
  blockhash: string;
}

// ... 여기에 도메인별 페이로드 인터페이스들을 계속 추가합니다.
