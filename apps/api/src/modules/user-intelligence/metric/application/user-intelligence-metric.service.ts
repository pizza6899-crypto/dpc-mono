import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserIntelligenceMath as MathUtils } from '../../common/math/user-intelligence-math';
import {
  CASINO_METRIC_PORT,
  USER_ACTIVITY_METRIC_PORT,
  USER_INTELLIGENCE_SCORE_PORT,
  WALLET_METRIC_PORT,
} from '../ports';
import type {
  ICasinoMetricPort,
  IUserActivityMetricPort,
  IUserIntelligenceScorePort,
  IWalletMetricPort,
} from '../ports';
import { UserIntelligenceCalculatorService } from './user-intelligence-calculator.service';

@Injectable()
export class UserIntelligenceMetricService {
  private readonly logger = new Logger(UserIntelligenceMetricService.name);

  constructor(
    @Inject(USER_ACTIVITY_METRIC_PORT)
    private readonly activityPort: IUserActivityMetricPort,
    @Inject(CASINO_METRIC_PORT)
    private readonly casinoPort: ICasinoMetricPort,
    @Inject(WALLET_METRIC_PORT)
    private readonly walletPort: IWalletMetricPort,
    @Inject(USER_INTELLIGENCE_SCORE_PORT)
    private readonly scorePort: IUserIntelligenceScorePort,
    private readonly calculator: UserIntelligenceCalculatorService,
  ) { }

  /**
   * 특정 유저의 지능형 점수 및 지표 갱신
   */
  async refreshUserIntelligence(userId: bigint): Promise<void> {
    try {
      // 1. 기초 데이터 수집 (Metrics Gathering)
      const activity = await this.activityPort.getSessionStats(userId, 30);
      const community = await this.activityPort.getCommunityStats(userId);
      const rolling = await this.casinoPort.getBettingStats(userId);
      const totalRolling = await this.casinoPort.getRollingStats(userId);

      const d30 = await this.walletPort.getDepositStats(userId, 30);
      const d90 = await this.walletPort.getDepositStats(userId, 90);
      const d180 = await this.walletPort.getDepositStats(userId, 180);
      const totalD = await this.walletPort.getDepositStats(userId);
      const netLoss30 = await this.walletPort.getNetLossStats(userId, 30);
      const totalNetLoss = await this.walletPort.getNetLossStats(userId);

      // 2. CV 및 시계열 지표 산출
      const dailyWallet = await this.walletPort.getDailyWalletMetrics(userId, 30);
      const dailyNetLosses = dailyWallet.map((d) => d.netLossAmount.toNumber());
      const dailyDeposits = dailyWallet.map((d) => d.depositAmount.toNumber());

      const netLossCV = MathUtils.calculateCV(dailyNetLosses);
      const depositCV = MathUtils.calculateCV(dailyDeposits);

      // 입금 간격 CV (최근 180일 기준 간격 계산)
      // (실제 전체 입금 내역을 가져와서 계산해야 하나, 우선 Placeholder 유지)
      const intervalCV = 0.5;

      // 3. 점수 계산 (Scoring)
      const valScoreIndex = this.calculator.calculateValueIndexScore(
        totalNetLoss.toNumber(),
        netLoss30.toNumber(),
        netLossCV,
      );

      const valScoreDepositAmount = this.calculator.calculateDepositAmountScore(
        d30.totalUsd.toNumber(),
        d180.totalUsd.toNumber(),
        totalD.totalUsd.toNumber() - d180.totalUsd.toNumber(),
        depositCV,
        totalD.count,
      );

      const valScoreDepositCount = this.calculator.calculateDepositCountScore(
        d30.count,
        d90.count,
        intervalCV,
      );

      const valScoreRolling = this.calculator.calculateRollingScore(
        rolling.excessBettingFactor,
        rolling.excessBettingFactor, // 요구치 기여도 동일하게 적용(임시)
        rolling.bonusBettingRatio * 100,
      );

      const valScoreBehavior = this.calculator.calculateBehaviorScore({
        activeDays: activity.activeDays,
        avgSessionMinutes: activity.avgMinutes,
        validSessionRatio: 0.8, // Placeholder
        categoryCount: 3, // Placeholder
        postCount: community.postCount,
        commentCount: community.commentCount,
        chatCount: community.chatCount,
        missionDays: community.missionCompletionCount,
        missionRate: community.missionCompletionRate,
      });

      // 리스크 점수 (임시 하드코딩된 파라미터 활용)
      const riskPromotion = this.calculator.calculateRiskPromotionScore({
        bonusDepositRatio: 20, // 20%
        rollingCoverageThreshold: 50, // 50%
        extractionRate: 0.1,
        extractionAmountUsd: 100,
        repeatRate: 0.05,
      });

      const riskTechnical = this.calculator.calculateRiskTechnicalScore({
        ipOverlap: false,
        fingerprintOverlap: false,
        inconsistency: false,
        fingerprintChanges30d: 0,
      });

      const riskBehavior = this.calculator.calculateRiskBehaviorScore({
        lowValueReferralCount: 0,
        maliciousPostCount: 0,
      });

      // 최종 합산 (Base 1000 + ValueSum - RiskSum)
      const valueTotal =
        valScoreIndex +
        valScoreDepositAmount +
        valScoreDepositCount +
        valScoreRolling +
        valScoreBehavior;
      const riskTotal = riskPromotion + riskTechnical + riskBehavior;

      const baseValue = 1000;
      const finalValuation = MathUtils.clamp(baseValue + valueTotal, 1000, 2000);
      const finalTotalScore = finalValuation - riskTotal;

      // 4. 기존 점수 조회 및 이력 기록
      const currentScore = await this.scorePort.findCurrentScore(userId);

      // 5. DB 저장 (Upsert)
      await this.scorePort.upsertScore({
        userId,
        totalScore: finalTotalScore,
        valueScore: finalValuation,
        riskScore: riskTotal,
        scoreValueIndex: valScoreIndex,
        scoreDepositAmount: valScoreDepositAmount,
        scoreDepositCount: valScoreDepositCount,
        scoreRolling: valScoreRolling,
        scoreBehavior: valScoreBehavior,
        scoreRiskPromotion: riskPromotion,
        scoreRiskTechnical: riskTechnical,
        scoreRiskBehavior: riskBehavior,
        details: {
          netLossCV,
          depositCV,
          gatheredAt: new Date().toISOString(),
        },
      });

      // 6. 메트릭 원천 데이터 저장
      await this.scorePort.upsertMetric({
        userId,
        totalDepositUsd: totalD.totalUsd,
        recent30dDepositUsd: d30.totalUsd,
        recent180dDepositUsd: d180.totalUsd,
        depositCount: totalD.count,
        lifetimeNetLossUsd: totalNetLoss,
        recent30dNetLossUsd: netLoss30,
        totalRollingUsd: totalRolling,
        avgSessionMinutes: activity.avgMinutes,
        activeDays30d: activity.activeDays,
      });

      // 7. 점수가 변했다면 이력 추가
      if (!currentScore || currentScore.totalScore !== finalTotalScore) {
        await this.scorePort.addHistory({
          userId,
          prevTotalScore: currentScore?.totalScore ?? 1000,
          nextTotalScore: finalTotalScore,
          reason: 'Periodic background intelligence update',
        });
      }

      this.logger.log(`[User Intelligence] Updated score for User ${userId}: ${finalTotalScore}`);
    } catch (e) {
      this.logger.error(`Failed to refresh user intelligence for ${userId}: ${e.message}`, e.stack);
      throw e;
    }
  }
}
