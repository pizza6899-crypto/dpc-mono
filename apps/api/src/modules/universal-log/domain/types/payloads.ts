/**
 * [GAME 도메인]
 */
export interface ArtifactSynthesizePayload {
  mats: bigint[];
  resultItemId: bigint;
  success: boolean;
}

/**
 * [IAM 도메인]
 */
export interface UserLoginPayload {
  ipAddress: string;
  method: 'PASSWORD' | 'SNS';
  device: string;
}

// ... 여기에 도메인별 페이로드 인터페이스들을 계속 추가합니다.
