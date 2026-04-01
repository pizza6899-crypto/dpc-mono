/**
 * [GAME 도메인]
 */
export interface ArtifactDrawPayload {
  currencyCode: string;
  costAmount: number;
  provablyFair?: {
    blockhash: string;
    nonce: number;
  };
  items: Array<{
    id: string;
    grade: string;
    gradeRoll?: number;
    selectRoll?: number;
  }>;
}


export interface ArtifactEquipPayload {
  userArtifactId: string;
  artifactCode: string;
  slotNo: number;
  prevArtifactCode?: string | null; // 스왑된 경우 기존 슬롯에 있던 유물의 코드
}

export interface ArtifactUnequipPayload {
  userArtifactId: string;
  artifactCode: string;
}

// ... 여기에 도메인별 페이로드 인터페이스들을 계속 추가합니다.
