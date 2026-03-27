import { Injectable } from '@nestjs/common';
import { UserIntelligenceMath as MathUtils } from '../../common/math/user-intelligence-math';
import type { PolicyConfiguration } from '../../policy/domain/policy-config.types';

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
   * - 총 Net Loss (40% - 100점): policy.totalNetLossUnitAmount 당 1점
   * - 최근 30일 Net Loss (40% - 100점): policy.recent30dNetLossUnitAmount 당 1점
   * - 안정성 (20% - 50점): CV <= stabilityMinCV 만점 ~ CV >= stabilityMaxCV 0점
   * * 수익 유저는 안정성 0~10점으로 제한
   */
  calculateValueIndexScore(
    totalNetLossUsd: number,
    recent30dNetLossUsd: number,
    netLossCV: number,
    policy: PolicyConfiguration['valueIndex'],
  ): number {
    const totalLossScore = MathUtils.clamp(totalNetLossUsd / policy.totalNetLossUnitAmount, 0, 100);
    const recentLossScore = MathUtils.clamp(recent30dNetLossUsd / policy.recent30dNetLossUnitAmount, 0, 100);
    let stabilityScore = MathUtils.interpolate(netLossCV, policy.stabilityMaxCV, policy.stabilityMinCV, 0, 50);

    if (totalNetLossUsd <= 0) {
      stabilityScore = MathUtils.clamp(stabilityScore, 0, 10);
    }

    return Math.round(totalLossScore + recentLossScore + stabilityScore);
  }

  /**
   * 입금액(Deposit Amount) 점수 산출: 총 200점
   * - 30일 (80점): policy.d30UnitAmount 당 1점
   * - 180일 (60점): policy.d180UnitAmount 당 1점
   * - Lifetime-180 (30점): policy.lifetimeMinusUnitAmount 당 1점
   * - 입금안정성 (30점): CV <= stabilityMinCV 만점 ~ CV > stabilityMaxCV 0점
   * * 입금 횟수 가중치: 1회(0%), 2~3회(50%), 4회+(100%)
   */
  calculateDepositAmountScore(
    d30Usd: number,
    d180Usd: number,
    dLfMinus180Usd: number,
    depositCV: number,
    depositCount: number,
    policy: PolicyConfiguration['depositAmount'],
  ): number {
    const s30 = MathUtils.clamp(d30Usd / policy.d30UnitAmount, 0, 80);
    const s180 = MathUtils.clamp(d180Usd / policy.d180UnitAmount, 0, 60);
    const sLf = MathUtils.clamp(dLfMinus180Usd / policy.lifetimeMinusUnitAmount, 0, 30);
    const sStability = MathUtils.interpolate(depositCV, policy.stabilityMaxCV, policy.stabilityMinCV, 0, 30);

    const baseScore = s30 + s180 + sLf + sStability;

    let multiplier = 0;
    if (depositCount >= 4) multiplier = 1.0;
    else if (depositCount >= 2) multiplier = 0.5;

    return Math.round(baseScore * multiplier);
  }

  /**
   * 입금횟수(Deposit Count) 점수 산출: 총 100점
   * - 30일 입금일수 (50점): policy.d30ScorePerDay 점/일
   * - 90일 입금일수 (30점): policy.d90ScorePerDay 점/일
   * - 입금간격 CV (20점): CV <= intervalMinCV 만점 ~ CV >= intervalMaxCV 0점
   */
  calculateDepositCountScore(
    d30Days: number,
    d90Days: number,
    intervalCV: number,
    policy: PolicyConfiguration['depositCount'],
  ): number {
    const s30 = MathUtils.clamp(d30Days * policy.d30ScorePerDay, 0, 50);
    const s90 = MathUtils.clamp(d90Days * policy.d90ScorePerDay, 0, 30);
    const sInterval = MathUtils.interpolate(intervalCV, policy.intervalMaxCV, policy.intervalMinCV, 0, 20);

    return Math.round(s30 + s90 + sInterval);
  }

  /**
   * 롤링(Rolling) 점수 산출: 총 250점
   * - 입금대비 기여도 (100점): policy.contributionUnit 당 1점
   * - 요구치대비 기여도 (100점): policy.contributionUnit 당 1점
   * - 보너스의존도 감점 (50점): policy.bonusDependencyUnit % 당 1점 감점
   */
  calculateRollingScore(
    contributionVsDeposit: number,
    contributionVsRequirement: number,
    bonusDependencyRate: number, // 0 ~ 100
    policy: PolicyConfiguration['rolling'],
  ): number {
    const sDeposit = MathUtils.clamp(contributionVsDeposit / policy.contributionUnit, 0, 100);
    const sReq = MathUtils.clamp(contributionVsRequirement / policy.contributionUnit, 0, 100);
    const sBonusBase = 50;
    const sBonusPenalty = MathUtils.clamp(bonusDependencyRate / policy.bonusDependencyUnit, 0, 50);

    return Math.round(sDeposit + sReq + (sBonusBase - sBonusPenalty));
  }

  /**
   * 행동패턴(Behavior) 점수 산출: 총 200점
   */
  calculateBehaviorScore(
    params: {
      activeDays: number;
      avgSessionMinutes: number;
      validSessionRatio: number; // 0~1
      categoryCount: number;
      postCount: number;
      commentCount: number;
      chatCount: number;
      missionDays: number;
      missionRate: number; // 0~100
    },
    policy: PolicyConfiguration['behavior'],
  ): number {
    const sAccess = MathUtils.clamp(params.activeDays * policy.scorePerActiveDay, 0, 60);
    const sSession = MathUtils.clamp(params.avgSessionMinutes * policy.scorePerSessionMinute, 0, 30);
    const sValidRatio = MathUtils.clamp(params.validSessionRatio * 30, 0, 30);
    const sCategory = MathUtils.clamp(params.categoryCount * policy.scorePerCategory, 0, 20);

    const commPoints =
      params.postCount * policy.scorePerPost +
      params.commentCount * policy.scorePerComment +
      params.chatCount * policy.scorePerChat;
    const sCommunity = MathUtils.clamp(commPoints, 0, 20);

    const sMissionDays = MathUtils.clamp(params.missionDays * policy.scorePerMissionDay, 0, 10);
    const sMissionRate = MathUtils.clamp(params.missionRate / (100 / 30 * policy.missionRateUnit), 0, 30);

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
   */
  calculateRiskPromotionScore(
    params: {
      bonusDepositRatio: number; // 0~100
      rollingCoverageThreshold: number;
      extractionRate: number;
    },
    policy: PolicyConfiguration['riskPromotion'],
  ): number {
    const excessBonusRatio = Math.max(0, params.bonusDepositRatio - policy.bonusDepositRatioThreshold);
    const sBonusRisk = MathUtils.clamp(excessBonusRatio * policy.bonusExcessScorePerPercent, 0, 100);

    const excessRollingThreshold = Math.max(0, params.rollingCoverageThreshold - policy.rollingThreshold);
    const sRollingRisk = MathUtils.clamp(excessRollingThreshold * policy.rollingExcessScorePerPercent, 0, 120);

    const sExtractionRisk = MathUtils.clamp(params.extractionRate * 200, 0, 180);

    return Math.round(sBonusRisk + sRollingRisk + sExtractionRisk);
  }

  /**
   * 기술/계정 리스크 점수 산출: 총 250점
   */
  calculateRiskTechnicalScore(
    params: {
      ipOverlap: boolean;
      fingerprintOverlap: boolean;
      inconsistency: boolean;
      fingerprintChanges30d: number;
    },
    policy: PolicyConfiguration['riskTechnical'],
  ): number {
    let score = 0;
    if (params.ipOverlap) score += policy.ipOverlapScore;
    if (params.fingerprintOverlap) score += policy.fingerprintOverlapScore;
    if (params.inconsistency) score += policy.inconsistencyScore;

    if (params.fingerprintChanges30d >= 3) score += policy.fingerprintChange3Score;
    else if (params.fingerprintChanges30d >= 2) score += policy.fingerprintChange2Score;

    return MathUtils.clamp(score, 0, 250);
  }

  /**
   * 행동/커뮤니티 리스크 점수 산출: 총 200점
   */
  calculateRiskBehaviorScore(
    params: {
      lowValueReferralCount: number;
      maliciousPostCount: number;
    },
    policy: PolicyConfiguration['riskBehavior'],
  ): number {
    const sReferral = MathUtils.clamp(params.lowValueReferralCount * policy.scorePerLowValueReferral, 0, 100);
    const sMalicious = MathUtils.clamp(params.maliciousPostCount * policy.scorePerMaliciousPost, 0, 100);

    return sReferral + sMalicious;
  }
}
