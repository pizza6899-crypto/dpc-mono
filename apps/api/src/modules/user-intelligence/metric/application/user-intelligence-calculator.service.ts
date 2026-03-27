import { Injectable } from '@nestjs/common';
import { UserIntelligenceMath as MathUtils } from '../../common/math/user-intelligence-math';

export interface ScoreBreakdown {
  valueIndex: number;
  depositAmount: number;
  depositCount: number;
  rolling: number;
  behavior: number;
  riskPromotion: number;
  riskTechnical: number;
  riskBehavior: number;
}

@Injectable()
export class UserIntelligenceCalculatorService {
  /**
   * 가치(Value) 점수 산출: 총 250점
   * - 총 Net Loss (40% - 100점): $15당 1점 ($1500 만점)
   * - 최근 30일 Net Loss (40% - 100점): $10당 1점 ($1000 만점)
   * - 안정성 (20% - 50점): CV <= 0.3 (50점) ~ CV >= 2.0 (0점)
   * * 수익 유저는 0~10점 예외 처리
   */
  calculateValueIndexScore(
    totalNetLossUsd: number,
    recent30dNetLossUsd: number,
    netLossCV: number,
  ): number {
    // 1. 총 Net Loss (100점)
    const totalLossScore = MathUtils.clamp(totalNetLossUsd / 15, 0, 100);

    // 2. 최근 30일 Net Loss (100점)
    const recentLossScore = MathUtils.clamp(recent30dNetLossUsd / 10, 0, 100);

    // 3. 안정성 (50점)
    let stabilityScore = MathUtils.interpolate(netLossCV, 2.0, 0.3, 0, 50);

    // 수익 유저 예외 (Net Loss <= 0)
    if (totalNetLossUsd <= 0) {
      // 수익 유저는 안정성 점수를 0~10점으로 제한 (임시 로직)
      stabilityScore = MathUtils.clamp(stabilityScore, 0, 10);
    }

    return Math.round(totalLossScore + recentLossScore + stabilityScore);
  }

  /**
   * 입금액(Deposit Amount) 점수 산출: 총 200점
   * - 30일 (80점): $25당 1점 ($2000 만점)
   * - 180일 (60점): $150당 1점 ($9000 만점)
   * - Lifetime-180 (30점): $150당 1점 ($4500 만점)
   * - 입금안정성 (30점): CV <= 0.3 (30점) ~ CV > 1.6 (0점)
   * * 입금 횟수 가중치: 1회(0%), 2~3회(50%), 4회+(100%)
   */
  calculateDepositAmountScore(
    d30Usd: number,
    d180Usd: number,
    dLfMinus180Usd: number,
    depositCV: number,
    depositCount: number,
  ): number {
    const s30 = MathUtils.clamp(d30Usd / 25, 0, 80);
    const s180 = MathUtils.clamp(d180Usd / 150, 0, 60);
    const sLf = MathUtils.clamp(dLfMinus180Usd / 150, 0, 30);
    const sStability = MathUtils.interpolate(depositCV, 1.6, 0.3, 0, 30);

    const baseScore = s30 + s180 + sLf + sStability;

    // 가중치 적용
    let multiplier = 0;
    if (depositCount >= 4) multiplier = 1.0;
    else if (depositCount >= 2) multiplier = 0.5;

    return Math.round(baseScore * multiplier);
  }

  /**
   * 입금횟수(Deposit Count) 점수 산출: 총 100점
   * - 30일 입금일수 (50점): 1일당 3점 (17일 만점)
   * - 90일 입금일수 (30점): 1일당 1점 (30일 만점)
   * - 입금간격 CV (20점): CV <= 0.4 (20점) ~ CV >= 0.8 (0점)
   */
  calculateDepositCountScore(
    d30Days: number,
    d90Days: number,
    intervalCV: number,
  ): number {
    const s30 = MathUtils.clamp(d30Days * 3, 0, 50);
    const s90 = MathUtils.clamp(d90Days * 1, 0, 30);
    const sInterval = MathUtils.interpolate(intervalCV, 0.8, 0.4, 0, 20);

    return Math.round(s30 + s90 + sInterval);
  }

  /**
   * 롤링(Rolling) 점수 산출: 총 250점
   * - 입금대비 기여도 (100점): 0.03당 1점 (3.0배 만점)
   * - 요구치대비 기여도 (100점): 0.03당 1점 (3.0배 만점)
   * - 보너스의존도 (50점): 2%당 1점 감전 (intensity 0~100%)
   */
  calculateRollingScore(
    contributionVsDeposit: number,
    contributionVsRequirement: number,
    bonusDependencyRate: number, // 0 ~ 100
  ): number {
    const sDeposit = MathUtils.clamp(contributionVsDeposit / 0.03, 0, 100);
    const sReq = MathUtils.clamp(contributionVsRequirement / 0.03, 0, 100);
    const sBonusBase = 50;
    const sBonusPenalty = MathUtils.clamp(bonusDependencyRate / 2, 0, 50);

    return Math.round(sDeposit + sReq + (sBonusBase - sBonusPenalty));
  }

  /**
   * 행동패턴(Behavior) 점수 산출: 총 200점
   * - 접속일(유효세션) (60점): 1일당 2점 (30일 만점)
   * - 평균세션 (30점): 1분당 1점 (30분 만점)
   * - 유효세션비율/개수 (30점): (가정: 100% = 30점)
   * - 카테고리 이용 (20점): 1개당 4점 (5개 만점)
   * - 커뮤니티 활동 (20점): 게시글 3, 댓글 1, 채팅 0.5 (20점 만점)
   * - 미션 수행 (40점): 완료일 0.5 (10) + 완료율 0.3%당 1점 (30)
   */
  calculateBehaviorScore(params: {
    activeDays: number;
    avgSessionMinutes: number;
    validSessionRatio: number; // 0~1
    categoryCount: number;
    postCount: number;
    commentCount: number;
    chatCount: number;
    missionDays: number;
    missionRate: number; // 0~100
  }): number {
    const sAccess = MathUtils.clamp(params.activeDays * 2, 0, 60);
    const sSession = MathUtils.clamp(params.avgSessionMinutes * 1, 0, 30);
    const sValidRatio = MathUtils.clamp(params.validSessionRatio * 30, 0, 30);
    const sCategory = MathUtils.clamp(params.categoryCount * 4, 0, 20);

    const commPoints =
      params.postCount * 3 + params.commentCount * 1 + params.chatCount * 0.5;
    const sCommunity = MathUtils.clamp(commPoints, 0, 20);

    const sMissionDays = MathUtils.clamp(params.missionDays * 0.5, 0, 10);
    const sMissionRate = MathUtils.clamp(params.missionRate / 3.33, 0, 30); // 100% / 30 = 3.33... (0.3%당 1점 근사)

    return Math.round(
      sAccess +
      sSession +
      sValidRatio +
      sCategory +
      sCommunity +
      sMissionDays +
      sMissionRate,
    );
  }

  /**
   * 프로모션 리스크 점수 산출: 총 400점
   * - 보너스입금비율 60% 초과 시 1%당 3점 (100점)
   * - 롤링최소충족 20% 초과 1%당 1.5점 (120점)
   * - 나머지는 추출률/추출금액/반복률 등 (가정하여 180점 배분)
   */
  calculateRiskPromotionScore(params: {
    bonusDepositRatio: number; // 0~100
    rollingCoverageThreshold: number; // 0~100 (최소 롤링 대비 실제 롤링 비율 등)
    extractionRate: number; // 유효 추출 비율
    extractionAmountUsd: number;
    repeatRate: number;
  }): number {
    // 1. 보너스 입금 비율 (100점)
    const excessBonusRatio = Math.max(0, params.bonusDepositRatio - 60);
    const sBonusRisk = MathUtils.clamp(excessBonusRatio * 3, 0, 100);

    // 2. 롤링 최소 충족 (120점)
    const excessRollingThreshold = Math.max(
      0,
      params.rollingCoverageThreshold - 20,
    );
    const sRollingRisk = MathUtils.clamp(excessRollingThreshold * 1.5, 0, 120);

    // 3. 기타 (추출률 등 임시 180점 만점 배분)
    const sExtractionRisk = MathUtils.clamp(params.extractionRate * 200, 0, 180);

    return Math.round(sBonusRisk + sRollingRisk + sExtractionRisk);
  }

  /**
   * 기술/계정 리스크 점수 산출: 총 250점
   * - IP 중복: 100
   * - 디바이스 지문 중복: 50
   * - 일관성 부족: 30
   * - 지문 변화(30일): 2회(30), 3회+(70)
   */
  calculateRiskTechnicalScore(params: {
    ipOverlap: boolean;
    fingerprintOverlap: boolean;
    inconsistency: boolean;
    fingerprintChanges30d: number;
  }): number {
    let score = 0;
    if (params.ipOverlap) score += 100;
    if (params.fingerprintOverlap) score += 50;
    if (params.inconsistency) score += 30;

    if (params.fingerprintChanges30d >= 3) score += 70;
    else if (params.fingerprintChanges30d >= 2) score += 30;

    return MathUtils.clamp(score, 0, 250);
  }

  /**
   * 행동/커뮤니티 리스크 점수 산출: 총 200점
   * - 저가치 추천인 1명당 20점 (100점)
   * - 악성게시글 1회당 10점 (나머지 100점)
   */
  calculateRiskBehaviorScore(params: {
    lowValueReferralCount: number;
    maliciousPostCount: number;
  }): number {
    const sReferral = MathUtils.clamp(params.lowValueReferralCount * 20, 0, 100);
    const sMalicious = MathUtils.clamp(params.maliciousPostCount * 10, 0, 100);

    return sReferral + sMalicious;
  }
}
