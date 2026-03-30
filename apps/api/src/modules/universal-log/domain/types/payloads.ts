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

export interface ArtifactRewardPayload {
  rewardType: string;
  rewardValue: string;
  reason: string;
}

// ... 여기에 도메인별 페이로드 인터페이스들을 계속 추가합니다.
