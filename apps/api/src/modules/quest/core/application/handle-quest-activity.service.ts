import { Inject, Injectable } from '@nestjs/common';
import { QuestType, ExchangeCurrencyCode } from '@prisma/client';
import { QUEST_MASTER_REPOSITORY_TOKEN } from '../ports/quest-master.repository.token';
import { USER_QUEST_REPOSITORY_TOKEN } from '../ports/user-quest.repository.token';
import type { QuestMasterRepository } from '../ports/quest-master.repository.port';
import type { UserQuestRepository } from '../ports/user-quest.repository.port';
import { UserQuest } from '../domain/models';

@Injectable()
export class HandleQuestActivityService {
  constructor(
    @Inject(QUEST_MASTER_REPOSITORY_TOKEN)
    private readonly questMasterRepository: QuestMasterRepository,
    @Inject(USER_QUEST_REPOSITORY_TOKEN)
    private readonly userQuestRepository: UserQuestRepository,
  ) { }

  /**
   * 유저의 특정 활동(출석, 게임 플레이 등)에 대해 관련된 모든 퀘스트의 진행도를 갱신합니다.
   */
  async execute(params: {
    userId: bigint;
    type: QuestType;
    currency: ExchangeCurrencyCode;
    amount?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const { userId, type, currency, amount = 0, metadata = {} } = params;

    // 1. 해당 타입의 활성화된 퀘스트 목록 조회
    const activeQuests = await this.questMasterRepository.findByType(type);
    if (activeQuests.length === 0) return;

    for (const quest of activeQuests) {
      // 기간 및 활성화 상태 체크
      if (!quest.isAvailable()) continue;

      // 2. 유저의 현재 퀘스트 진행 상태 조회 (없으면 생성)
      const cycleId = this.resolveCycleId(quest.resetCycle);

      let userQuest = await this.userQuestRepository.findOne(userId, quest.id, cycleId);

      if (!userQuest) {
        // TODO: 참여 자격 체크 로직 (entryRule 등)
        // if (!this.checkEntryEligibility(userId, quest)) continue;

        userQuest = UserQuest.create({
          userId,
          questMasterId: quest.id,
          currency,
        });
      }

      // 이미 완료/수령된 상태면 스킵 (리셋 주기에 따라 다를 수 있으나 findOne에서 이미 필터링 되었을 것)
      if (userQuest.status !== 'IN_PROGRESS') continue;

      // 3. 진행도 업데이트 및 완료 여부 판정
      const currentProgress = userQuest.progressData;

      // TODO: MatchRule에 따른 실적 인정 여부 필터링 필요 (예: 특정 게임 카테고리만 인정)
      // if (!this.isMatch(quest.getGoal(currency), metadata)) continue;

      const newCount = (currentProgress.currentCount || 0) + 1;
      const newAmount = (currentProgress.currentAmount || 0) + amount;

      // Goal과 대조하여 완료 여부 판정
      const goal = quest.getGoal(currency);
      const isCompleted = goal ? goal.isSatisfied(newCount, newAmount) : false;

      userQuest.updateProgress(
        {
          ...currentProgress,
          currentCount: newCount,
          currentAmount: newAmount,
          lastUpdatedAt: new Date().toISOString(),
        },
        isCompleted,
      );

      // 4. 저장
      await this.userQuestRepository.save(userQuest);

      // TODO: 만료 체크 로직 (필요 시)
    }
  }

  private resolveCycleId(cycle: string): string {
    if (cycle === 'DAILY') return new Date().toISOString().split('T')[0].replace(/-/g, '');
    return 'SINGLE';
  }
}
