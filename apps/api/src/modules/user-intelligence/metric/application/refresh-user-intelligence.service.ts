import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserIntelligenceMath as MathUtils } from '../../common/math/user-intelligence-math';
import {
  CASINO_METRIC_PORT,
  USER_ACTIVITY_METRIC_PORT,
  WALLET_METRIC_PORT,
} from '../ports';
import type {
  ICasinoMetricPort,
  IUserActivityMetricPort,
  IWalletMetricPort,
} from '../ports';
import { GetActivePolicyService } from '../../policy/application/get-active-policy.service';
import { RecordScoreHistoryService } from '../../history/application/record-score-history.service';
import { UpdateUserScoreService } from '../../scoring/application/update-user-score.service';
import { GetUserScoreService } from '../../scoring/application/get-user-score.service';
import { UserIntelligenceCalculatorService } from './user-intelligence-calculator.service';
import { USER_METRIC_REPOSITORY_PORT } from '../ports';
import type { IUserMetricRepositoryPort } from '../ports';

/**
 * [User Intelligence] 특정 유저의 지능형 점수 및 지표를 강제 갱신하는 서비스 (Command)
 */
@Injectable()
export class RefreshUserIntelligenceService {
  private readonly logger = new Logger(RefreshUserIntelligenceService.name);

  constructor(
    @Inject(USER_ACTIVITY_METRIC_PORT)
    private readonly activityPort: IUserActivityMetricPort,
    @Inject(CASINO_METRIC_PORT)
    private readonly casinoPort: ICasinoMetricPort,
    @Inject(WALLET_METRIC_PORT)
    private readonly walletPort: IWalletMetricPort,
    @Inject(USER_METRIC_REPOSITORY_PORT)
    private readonly metricRepo: IUserMetricRepositoryPort,
    private readonly calculator: UserIntelligenceCalculatorService,
    private readonly getActivePolicyService: GetActivePolicyService,
    private readonly getScoreService: GetUserScoreService,
    private readonly updateScoreService: UpdateUserScoreService,
    private readonly recordScoreHistoryService: RecordScoreHistoryService,
  ) { }

  /**
   * 유저의 모든 지표를 수집하고 가치/리스크 점수를 재계산하여 저장합니다.
   */
  async execute(userId: bigint): Promise<void> {
    try {
      // 0. 활성 정책 조회
      const policy = await this.getActivePolicyService.getConfig();

      // 1. 기초 데이터 수집 (Metrics Gathering)
      const [activity, community, rolling, totalRolling, d30, d90, d180, totalD, netLoss30, totalNetLoss] = await Promise.all([
        this.activityPort.getSessionStats(userId, 30),
        this.activityPort.getCommunityStats(userId),
        this.casinoPort.getBettingStats(userId),
        this.casinoPort.getRollingStats(userId),
        this.walletPort.getDepositStats(userId, 30),
        this.walletPort.getDepositStats(userId, 90),
        this.walletPort.getDepositStats(userId, 180),
        this.walletPort.getDepositStats(userId),
        this.walletPort.getNetLossStats(userId, 30),
        this.walletPort.getNetLossStats(userId),
      ]);

      // 2. CV 및 시계열 지표 산출
      const dailyWallet = await this.walletPort.getDailyWalletMetrics(userId, 30);
      const dailyNetLosses = dailyWallet.map((d) => d.netLossAmount.toNumber());
      const dailyDeposits = dailyWallet.map((d) => d.depositAmount.toNumber());

      const netLossCV = MathUtils.calculateCV(dailyNetLosses);
      const depositCV = MathUtils.calculateCV(dailyDeposits);
      const intervalCV = 0.5; // TODO: 실제 입금 간격 CV 계산

      // 3. 점수 계산 (Scoring)
      const valScoreIndex = this.calculator.calculateValueIndexScore(
        totalNetLoss.toNumber(),
        netLoss30.toNumber(),
        netLossCV,
        policy.valueIndex,
      );
      const valScoreDepositAmount = this.calculator.calculateDepositAmountScore(
        d30.totalUsd.toNumber(),
        d180.totalUsd.toNumber(),
        totalD.totalUsd.toNumber() - d180.totalUsd.toNumber(),
        depositCV,
        totalD.count,
        policy.depositAmount,
      );
      const valScoreDepositCount = this.calculator.calculateDepositCountScore(
        d30.count, d90.count, intervalCV, policy.depositCount,
      );
      const valScoreRolling = this.calculator.calculateRollingScore(
        rolling.excessBettingFactor, rolling.excessBettingFactor,
        rolling.bonusBettingRatio * 100, policy.rolling,
      );
      const valScoreBehavior = this.calculator.calculateBehaviorScore(
        {
          activeDays: activity.activeDays,
          avgSessionMinutes: activity.avgMinutes,
          validSessionRatio: 0.8,
          categoryCount: 3,
          postCount: community.postCount,
          commentCount: community.commentCount,
          chatCount: community.chatCount,
          missionDays: community.missionCompletionCount,
          missionRate: community.missionCompletionRate,
        },
        policy.behavior,
      );
      const riskPromotion = this.calculator.calculateRiskPromotionScore(
        { bonusDepositRatio: 20, rollingCoverageThreshold: 50, extractionRate: 0.1 },
        policy.riskPromotion,
      );
      const riskTechnical = this.calculator.calculateRiskTechnicalScore(
        { ipOverlap: false, fingerprintOverlap: false, inconsistency: false, fingerprintChanges30d: 0 },
        policy.riskTechnical,
      );
      const riskBehavior = this.calculator.calculateRiskBehaviorScore(
        { lowValueReferralCount: 0, maliciousPostCount: 0 },
        policy.riskBehavior,
      );

      // 최종 합산
      const valueTotal = valScoreIndex + valScoreDepositAmount + valScoreDepositCount + valScoreRolling + valScoreBehavior;
      const riskTotal = riskPromotion + riskTechnical + riskBehavior;
      const baseValue = 1000;
      const finalValuation = MathUtils.clamp(baseValue + valueTotal, 1000, 2000);
      const finalTotalScore = finalValuation - riskTotal;

      // 4. 기존 점수 조회
      const currentScore = await this.getScoreService.findOrNull(userId);

      // 5. 점수 저장 (ScoringModule 위임) + 지표 원천 저장 (MetricRepo 위임)
      await Promise.all([
        this.updateScoreService.execute({
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
          details: { netLossCV, depositCV, gatheredAt: new Date().toISOString() },
        }),
        this.metricRepo.upsertMetric({
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
        }),
      ]);

      // 6. 이력 기록 (HistoryModule 위임)
      await this.recordScoreHistoryService.execute({
        userId,
        prevTotalScore: currentScore?.totalScore ?? 1000,
        nextTotalScore: finalTotalScore,
        reason: 'Intelligence automated update',
      });

      this.logger.log(`[User Intelligence] Refreshed score for User ${userId}: ${finalTotalScore}`);
    } catch (e) {
      this.logger.error(`Failed to refresh user intelligence for ${userId}: ${e.message}`, e.stack);
      throw e;
    }
  }
}
