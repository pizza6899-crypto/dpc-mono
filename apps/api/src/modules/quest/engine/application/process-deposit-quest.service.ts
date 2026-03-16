import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { QUEST_MASTER_REPOSITORY_TOKEN } from '../../core/ports/quest-master.repository.token';
import type { QuestMasterRepository } from '../../core/ports/quest-master.repository.port';
import { USER_QUEST_REPOSITORY_TOKEN } from '../../core/ports/user-quest.repository.token';
import type { UserQuestRepository } from '../../core/ports/user-quest.repository.port';
import { USER_QUEST_CONTEXT_PORT_TOKEN } from '../../core/ports/user-quest-context.port';
import type { UserQuestContextPort } from '../../core/ports/user-quest-context.port';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { Prisma } from '@prisma/client';
import { UserQuest } from '../../core/domain/models/user-quest.entity';
import { QuestMasterSnapshot } from '../../core/domain/models/quest.interface';
import type {
  ProcessDepositQuestCommand,
  QuestProcessResult,
  ValidateQuestEligibilityCommand
} from 'src/modules/deposit/ports/out/quest-engine.port';

@Injectable()
export class ProcessDepositQuestService {
  private readonly logger = new Logger(ProcessDepositQuestService.name);

  constructor(
    @Inject(QUEST_MASTER_REPOSITORY_TOKEN)
    private readonly questMasterRepository: QuestMasterRepository,
    @Inject(USER_QUEST_REPOSITORY_TOKEN)
    private readonly userQuestRepository: UserQuestRepository,
    @Inject(USER_QUEST_CONTEXT_PORT_TOKEN)
    private readonly userQuestContextPort: UserQuestContextPort,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  @Transactional()
  async processDepositQuest(command: ProcessDepositQuestCommand): Promise<QuestProcessResult> {
    const { userId, questId, depositId, actuallyPaid, currency } = command;

    this.logger.log(`Evaluating deposit quest for user ${userId}, quest: ${questId}`);

    // 0. 동시성 제어 (유저별/퀘스트별 락) - 결과 도출 중 중복 생성 방지
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_QUEST,
      `${userId}:${questId}`,
      { throwThrottleError: true }
    );

    // 1. QuestMaster 조회
    const quest = await this.questMasterRepository.findById(questId);
    if (!quest || !quest.isAvailable()) {
      this.logger.warn(`Quest not found or not available: ${questId}`);
      return { isSatisfied: false };
    }

    // 2. 이미 해당 입금으로 처리된 이력이 있는지 확인 (중복 방지)
    const existingUserQuest = await this.userQuestRepository.findBySourceId(depositId);
    if (existingUserQuest) {
      this.logger.warn(`Quest already processed for deposit: ${depositId}`);
      return { isSatisfied: false };
    }

    // 3. UserQuestContextPort를 통해 유저 자격 확인
    const userContext = await this.userQuestContextPort.getEntryContext(userId);
    if (!quest.canEntry(userContext)) {
      this.logger.warn(`User ${userId} not eligible for quest ${questId}`);
      return { isSatisfied: false };
    }

    // 4. 입금액(actuallyPaid)가 퀘스트 조건(목표액)을 만족하는지 확인
    const goal = quest.getGoal(currency);
    if (!goal || !goal.isSatisfied(1, actuallyPaid.toNumber())) {
      this.logger.warn(`Deposit amount ${actuallyPaid} does not satisfy goal for quest ${questId}`);
      return { isSatisfied: false };
    }

    // 5. 보상 정보 가져오기
    const reward = quest.rewards.find(r => r.currency === currency) || quest.rewards.find(r => r.currency === null);
    if (!reward) {
      this.logger.warn(`No reward defined for quest ${questId} in currency ${currency}`);
      return { isSatisfied: false };
    }

    // 보상 금액 계산
    let rewardAmount = new Prisma.Decimal(0);
    if (reward.value.amount) {
      rewardAmount = new Prisma.Decimal(reward.value.amount);
    } else if (reward.value.bonusRate) {
      rewardAmount = actuallyPaid.mul(reward.value.bonusRate);
      if (reward.value.maxAmount && rewardAmount.gt(reward.value.maxAmount)) {
        rewardAmount = new Prisma.Decimal(reward.value.maxAmount);
      }
    }

    if (rewardAmount.isZero()) {
      this.logger.warn(`Calculated reward amount is 0 for quest ${questId}`);
      return { isSatisfied: false };
    }

    // 6. UserQuest 생성 및 완료 처리 (처리 이력을 남기기 위해 저장)
    const userQuest = UserQuest.create({
      userId,
      questMasterId: questId,
      currency,
      sourceId: depositId,
    });
    userQuest.updateProgress({}, true); // 즉시 완료
    await this.userQuestRepository.save(userQuest);

    this.logger.log(`Quest ${questId} satisfied for user ${userId}. Reward: ${rewardAmount} ${currency}`);

    return {
      isSatisfied: true,
      userQuestId: userQuest.id,
      rewardAmount: rewardAmount,
      wageringMultiplier: reward.wageringMultiplier,
    };
  }

  async validateQuestEligibility(command: ValidateQuestEligibilityCommand): Promise<boolean> {
    const { userId, questId, currency, amount } = command;

    const quest = await this.questMasterRepository.findById(questId);
    if (!quest || !quest.isAvailable()) {
      return false;
    }

    // 1. 해당 통화에 대한 목표(Goal)가 있는지 확인
    const goal = quest.getGoal(currency);
    if (!goal) {
      return false;
    }

    // 2. 해당 통화에 대한 보상(Reward)이 설정되어 있는지 확인 (전용 혹은 공통 보상)
    const hasReward = quest.rewards.some(
      (r) => r.currency === currency || r.currency === null,
    );
    if (!hasReward) {
      return false;
    }

    // 3. 유저 참여 자격 확인 (출금 이력, 입금 횟수 등)
    const userContext = await this.userQuestContextPort.getEntryContext(userId);
    if (!quest.canEntry(userContext)) {
      return false;
    }

    // 4. 입금 신청 금액이 최소 조건을 충족하는지 확인
    if (amount && !goal.isSatisfied(1, amount.toNumber())) {
      return false;
    }

    return true;
  }

  /**
   * 퀘스트의 현재 설정 정보를 스냅샷 형태로 가져옵니다.
   */
  async getQuestSnapshot(questId: bigint): Promise<QuestMasterSnapshot | null> {
    const quest = await this.questMasterRepository.findById(questId);
    if (!quest) {
      return null;
    }

    // 도메인 엔티티를 입금 시점용 가벼운 스냅샷 데이터로 변환
    return quest.toSnapshot();
  }
}
