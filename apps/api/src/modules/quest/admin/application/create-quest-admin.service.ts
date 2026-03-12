import { Inject, Injectable } from '@nestjs/common';
import { QUEST_MASTER_REPOSITORY_TOKEN } from '../../core/ports/quest-master.repository.token';
import type { QuestMasterRepository } from '../../core/ports/quest-master.repository.port';
import { CreateQuestAdminDto } from '../controllers/dto/request/create-quest-admin.dto';
import { QuestMaster, QuestGoal, QuestReward, QuestTranslation } from '../../core/domain/models';

@Injectable()
export class CreateQuestAdminService {
  constructor(
    @Inject(QUEST_MASTER_REPOSITORY_TOKEN)
    private readonly questMasterRepository: QuestMasterRepository,
  ) { }

  async execute(dto: CreateQuestAdminDto, adminId: bigint): Promise<bigint> {
    // 1. 하위 도메인 엔티티 생성
    const translations = dto.translations.map(t => QuestTranslation.create({
      language: t.language,
      title: t.title,
      description: t.description,
    }));

    const goals = dto.goals.map(g => QuestGoal.create({
      currency: g.currency,
      targetAmount: g.targetAmount,
      targetCount: g.targetCount,
      matchRule: g.matchRule,
    }));

    const rewards = dto.rewards.map(r => QuestReward.create({
      type: r.type,
      currency: r.currency,
      value: r.value,
      expireDays: r.expireDays,
      wageringMultiplier: r.wageringMultiplier,
    }));

    // 2. Aggregate Root(QuestMaster) 생성
    const questMaster = QuestMaster.create({
      type: dto.type,
      category: dto.category,
      resetCycle: dto.resetCycle,
      maxAttempts: dto.maxAttempts,
      isActive: dto.isActive,
      parentId: dto.parentId ? BigInt(dto.parentId) : null,
      precedingId: dto.precedingId ? BigInt(dto.precedingId) : null,
      metadata: dto.metadata,
      entryRule: dto.entryRule,
      startTime: dto.startTime ? new Date(dto.startTime) : null,
      endTime: dto.endTime ? new Date(dto.endTime) : null,
      updatedBy: adminId,
      translations,
      goals,
      rewards,
    });

    // 3. Repository에 위임 (내부에서 tx 및 중첩 생성 처리)
    return await this.questMasterRepository.save(questMaster);
  }
}
