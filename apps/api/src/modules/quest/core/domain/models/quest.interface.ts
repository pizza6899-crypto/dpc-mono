/**
 * 퀘스트 참여 자격 규칙 (입구 컷)
 */
export interface QuestEntryRule {
  requireNoWithdrawal?: boolean;   // 출금 내역 없어야 함
  maxWithdrawalCount?: number;     // 최대 출금 횟수 제한
  isFirstDepositOnly?: boolean;    // 첫 입금 한정 여부
}

/**
 * 실적 판정 규칙
 * - 세부 판정 로직(게임 종류, 배당 등)은 Wagering 등 라이브 모듈에 위임합니다.
 * - 여기서는 대상임을 식별하기 위한 최소한의 파라미터만 관리합니다.
 */
export interface QuestMatchRule {

}

/**
 * 보상 상세 설정
 */
export interface QuestRewardValue {
  amount?: number;         // 보상 금액
  bonusRate?: number;      // 지급 배율 (입금액 대비 등)
  maxAmount?: number;      // 최대 지급 한도
  point?: number;          // 지급 포인트
  badgeId?: string;        // 배지 ID
  couponId?: string;       // 쿠폰 ID
}

/**
 * 유저별 퀘스트 진행 데이터
 * - 누적형 퀘스트인 경우에만 관련 수치를 관리합니다.
 * - 단발성(입금 프로모션 등)인 경우 빈 객체로 사용 가능합니다.
 */
export interface UserQuestProgressData {
  currentCount?: number;   // 현재 달성 횟수
  currentAmount?: number;  // 현재 누적 금액
  lastUpdatedAt?: string;  // 마지막 갱신 일시
}

/**
 * 보상 지급 당시의 스냅샷 정보
 */
export interface UserRewardHistoryDetail {
  txId?: string;           // 지갑 트랜잭션 ID 등
  note?: string;           // 지급 관련 비고
  source?: any;            // 원천 데이터 스냅샷
}

/**
 * 입금 시점에 저장되는 퀘스트 정의 스냅샷
 */
export interface QuestMasterSnapshot {
  id: bigint | string;
  type: string;
  resetCycle: string;
  entryRule: QuestEntryRule;
  startTime: Date | string | null;
  endTime: Date | string | null;
  goals: Array<{
    id: bigint | string;
    currency: string | null;
    targetCount: number | null;
    targetAmount: number | string | any | null;
    matchRule: QuestMatchRule;
  }>;
  rewards: Array<{
    id: bigint | string;
    type: string;
    value: QuestRewardValue;
    currency: string | null;
    wageringMultiplier: number | string | any | null;
  }>;
  translations: Array<{
    language: string;
    title: string;
    description: string | null;
  }>;
}
