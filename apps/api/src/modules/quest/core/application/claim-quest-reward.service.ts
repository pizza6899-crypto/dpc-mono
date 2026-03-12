import { Inject, Injectable } from '@nestjs/common';
import { USER_QUEST_REPOSITORY_TOKEN } from '../ports/user-quest.repository.token';
import type { UserQuestRepository } from '../ports/user-quest.repository.port';
import { QuestNotCompletedException, QuestAlreadyClaimedException, UserQuestNotFoundException } from '../domain/quest-core.exception';

@Injectable()
export class ClaimQuestRewardService {
  constructor(
    @Inject(USER_QUEST_REPOSITORY_TOKEN)
    private readonly userQuestRepository: UserQuestRepository,
  ) {}

  /**
   * 완료된 퀘스트의 보상을 수령 처리합니다.
   * 실제 보상 지급 로직(지갑 입금 등)은 이 서비스 이후의 프로세스(이벤트 등)에서 처리하는 것을 권장합니다.
   */
  async execute(params: {
    userId: bigint;
    userQuestId: bigint;
  }): Promise<void> {
    const { userId, userQuestId } = params;

    // 1. 유저 퀘스트 내역 조회
    const userQuest = await this.userQuestRepository.findById(userQuestId);
    if (!userQuest || userQuest.userId !== userId) {
      throw new UserQuestNotFoundException();
    }

    // 2. 도메인 로직: 수령 가능 여부 검증 및 상태 변경
    // markAsClaimed() 내부에서 QuestAlreadyClaimedException, QuestNotCompletedException 등을 발생시킵니다.
    userQuest.markAsClaimed();

    // 3. 변경 사항 저장
    await this.userQuestRepository.save(userQuest);

    // TODO: 실제 보상 지급 트리거 (예: RewardService 호출 또는 Event 발행)
  }
}
