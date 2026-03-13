import { Inject, Injectable } from '@nestjs/common';
import { QUEST_MASTER_REPOSITORY_TOKEN } from '../../core/ports/quest-master.repository.token';
import { USER_QUEST_REPOSITORY_TOKEN } from '../../core/ports/user-quest.repository.token';
import type { QuestMasterRepository } from '../../core/ports/quest-master.repository.port';
import type { UserQuestRepository } from '../../core/ports/user-quest.repository.port';
import { GetQuestsUserQueryDto } from '../controllers/dto/request/get-quests-user-query.dto';
import { QuestUserResponseDto } from '../controllers/dto/response/quest-user-response.dto';
import { PaginatedData } from 'src/common/http/types';
import { Language, ExchangeCurrencyCode, QuestType } from '@prisma/client';

@Injectable()
export class FindQuestsUserService {
  constructor(
    @Inject(QUEST_MASTER_REPOSITORY_TOKEN)
    private readonly questMasterRepository: QuestMasterRepository,
    @Inject(USER_QUEST_REPOSITORY_TOKEN)
    private readonly userQuestRepository: UserQuestRepository,
  ) { }

  async list(
    userId: bigint,
    query: GetQuestsUserQueryDto,
    language: Language,
    currency: ExchangeCurrencyCode,
  ): Promise<PaginatedData<QuestUserResponseDto>> {
    const { page = 1, limit = 20, type } = query;

    // 1. 활성 퀘스트 마스터 목록 조회
    const { items: masters, total } = await this.questMasterRepository.list({
      skip: (page - 1) * limit,
      take: limit,
      type,
      isActive: true,
      sortBy: 'displayOrder',
      sortOrder: 'asc',
    });

    if (masters.length === 0) {
      return { data: [], page, limit, total: 0 };
    }

    // 2. 해당 유저의 진행 상태 조회
    const userQuests = await this.userQuestRepository.findByUserIdAndQuestMasterIds(
      userId,
      masters.map((m) => m.id),
    );

    const userQuestMap = new Map(userQuests.map((uq) => [uq.questMasterId, uq]));

    // 3. 응답 DTO 매핑
    const data = masters.map((master) => {
      const userQuest = userQuestMap.get(master.id);
      const translation =
        master.translations.find((t) => t.language === language) ??
        master.translations.find((t) => t.language === Language.EN) ??
        master.translations[0];

      const goal = master.getGoal(currency);

      return {
        id: master.id.toString(), // TODO: Sqid 적용 필요시 컨트롤러에서 처리
        type: master.type,
        category: master.category,
        resetCycle: master.resetCycle,
        title: translation?.title ?? '',
        description: translation?.description ?? null,
        iconUrl: master.iconUrl,
        isHot: master.isHot,
        isNew: master.isNew,
        rewards: master.rewards
          .filter(r => r.currency === null || r.currency === currency)
          .map(r => ({
            type: r.type,
            currency: r.currency,
            amount: r.value.amount ?? null,
            point: r.value.point ?? null,
          })),
        status: userQuest?.status ?? null,
        currentCount: userQuest?.progressData.currentCount ?? 0,
        targetCount: goal?.targetCount ?? null,
        currentAmount: userQuest?.progressData.currentAmount ?? 0,
        targetAmount: goal?.targetAmount ? Number(goal.targetAmount) : null,
      };
    });

    return {
      data,
      page,
      limit,
      total,
    };
  }
}
