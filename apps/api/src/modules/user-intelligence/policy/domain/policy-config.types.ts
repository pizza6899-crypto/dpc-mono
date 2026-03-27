/**
 * [Policy] Value Index 설정
 * 가치 지수 산출 기준
 */
export interface ValueIndexConfig {
  /** 총 Net Loss 100점 만점 기준 달러 단위 ($15 당 1점) */
  totalNetLossUnitAmount: number;
  /** 최근 30일 Net Loss 100점 만점 기준 달러 단위 ($10 당 1점) */
  recent30dNetLossUnitAmount: number;
  /** 안정성 CV 최대점 기준 (이 이하면 만점 50점) */
  stabilityMinCV: number;
  /** 안정성 CV 최소점 기준 (이 이상이면 0점) */
  stabilityMaxCV: number;
}

/**
 * [Policy] Deposit Amount 설정
 * 입금액 점수 산출 기준
 */
export interface DepositAmountConfig {
  /** 30일 입금 단위 금액 ($25 당 1점, 80점 만점) */
  d30UnitAmount: number;
  /** 180일 입금 단위 금액 ($150 당 1점, 60점 만점) */
  d180UnitAmount: number;
  /** Lifetime-180 입금 단위 금액 ($150 당 1점, 30점 만점) */
  lifetimeMinusUnitAmount: number;
  /** CV 안정성 최대점 기준 (이 이하면 30점 만점) */
  stabilityMinCV: number;
  /** CV 안정성 최소점 기준 (이 이상이면 0점) */
  stabilityMaxCV: number;
}

/**
 * [Policy] Deposit Count 설정
 * 입금 횟수/빈도 점수 산출 기준
 */
export interface DepositCountConfig {
  /** 30일 입금일당 점수 (3점/일, 50점 만점) */
  d30ScorePerDay: number;
  /** 90일 입금일당 점수 (1점/일, 30점 만점) */
  d90ScorePerDay: number;
  /** 입금간격 CV 최대점 기준 (이 이하면 20점 만점) */
  intervalMinCV: number;
  /** 입금간격 CV 최소점 기준 (이 이상이면 0점) */
  intervalMaxCV: number;
}

/**
 * [Policy] Rolling 설정
 * 롤링 기여도 점수 산출 기준
 */
export interface RollingConfig {
  /** 기여도 단위 (0.03 당 1점, 각 100점 만점) */
  contributionUnit: number;
  /** 보너스의존도 감점 단위 (2% 당 1점, 50점 만점) */
  bonusDependencyUnit: number;
}

/**
 * [Policy] Behavior 설정
 * 행동 패턴 점수 산출 기준
 */
export interface BehaviorConfig {
  /** 접속일당 점수 (2점/일, 60점 만점) */
  scorePerActiveDay: number;
  /** 평균 세션 분당 점수 (1점/분, 30점 만점) */
  scorePerSessionMinute: number;
  /** 카테고리당 점수 (4점, 20점 만점) */
  scorePerCategory: number;
  /** 게시글당 점수 */
  scorePerPost: number;
  /** 댓글당 점수 */
  scorePerComment: number;
  /** 채팅당 점수 */
  scorePerChat: number;
  /** 미션완료일당 점수 (0.5점/일, 10점 만점) */
  scorePerMissionDay: number;
  /** 미션완료율 단위당 점수 (0.3% 당 1점, 30점 만점) */
  missionRateUnit: number;
}

/**
 * [Policy] Risk Promotion 설정
 * 프로모션 리스크 점수 산출 기준
 */
export interface RiskPromotionConfig {
  /** 보너스 입금 비율 임계값 (60% 초과 시 1%당 3점) */
  bonusDepositRatioThreshold: number;
  /** 보너스 초과 비율당 점수 */
  bonusExcessScorePerPercent: number;
  /** 롤링 최소 충족률 임계값 (20% 초과 시 1%당 1.5점) */
  rollingThreshold: number;
  /** 롤링 초과 비율당 점수 */
  rollingExcessScorePerPercent: number;
}

/**
 * [Policy] Risk Technical 설정
 * 기술/계정 리스크 점수 산출 기준
 */
export interface RiskTechnicalConfig {
  /** IP 중복 점수 */
  ipOverlapScore: number;
  /** 디바이스 지문 중복 점수 */
  fingerprintOverlapScore: number;
  /** 일관성 부족 점수 */
  inconsistencyScore: number;
  /** 지문 변화 2회 점수 */
  fingerprintChange2Score: number;
  /** 지문 변화 3회+ 점수 */
  fingerprintChange3Score: number;
}

/**
 * [Policy] Risk Behavior 설정
 * 행동/커뮤니티 리스크 점수 산출 기준
 */
export interface RiskBehaviorConfig {
  /** 저가치 추천인 1명당 점수 (최대 100점) */
  scorePerLowValueReferral: number;
  /** 악성 게시글 1회당 점수 (최대 100점) */
  scorePerMaliciousPost: number;
}

/**
 * UserIntelligencePolicy 의 config JSON 전체 구조
 */
export interface PolicyConfiguration {
  valueIndex: ValueIndexConfig;
  depositAmount: DepositAmountConfig;
  depositCount: DepositCountConfig;
  rolling: RollingConfig;
  behavior: BehaviorConfig;
  riskPromotion: RiskPromotionConfig;
  riskTechnical: RiskTechnicalConfig;
  riskBehavior: RiskBehaviorConfig;
}
