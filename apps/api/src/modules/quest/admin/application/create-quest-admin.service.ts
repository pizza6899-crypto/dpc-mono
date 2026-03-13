import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { QUEST_MASTER_REPOSITORY_TOKEN } from '../../core/ports/quest-master.repository.token';
import type { QuestMasterRepository } from '../../core/ports/quest-master.repository.port';
import { CreateQuestAdminDto } from '../controllers/dto/request/create-quest-admin.dto';
import { QuestMaster, QuestGoal, QuestReward, QuestTranslation } from '../../core/domain/models';
import { AttachFileService } from '../../../file/application/attach-file.service';
import { FileUsageType } from '../../../file/domain';
import { FileUrlService } from '../../../file/application/file-url.service';

@Injectable()
export class CreateQuestAdminService {
  constructor(
    @Inject(QUEST_MASTER_REPOSITORY_TOKEN)
    private readonly questMasterRepository: QuestMasterRepository,
    private readonly attachFileService: AttachFileService,
    private readonly fileUrlService: FileUrlService,
  ) { }

  @Transactional()
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
      value: {
        amount: r.amount,
        bonusRate: r.bonusRate,
        maxAmount: r.maxAmount,
        point: r.point,
        badgeId: r.badgeId,
        couponId: r.couponId,
      },
      expireDays: r.expireDays,
      wageringMultiplier: r.wageringMultiplier ?? 0,
    }));

    // 2. Aggregate Root(QuestMaster) 생성
    const questMaster = QuestMaster.create({
      type: dto.type,
      category: dto.category,
      resetCycle: dto.resetCycle,
      maxAttempts: dto.maxAttempts,
      isActive: dto.isActive,
      isHot: dto.isHot,
      isNew: dto.isNew,
      iconFileId: dto.iconFileId ? BigInt(dto.iconFileId) : null,
      displayOrder: dto.displayOrder,
      parentId: dto.parentId ? BigInt(dto.parentId) : null,
      precedingId: dto.precedingId ? BigInt(dto.precedingId) : null,
      entryRule: {
        requireNoWithdrawal: dto.requireNoWithdrawal,
        maxWithdrawalCount: dto.maxWithdrawalCount,
        isFirstDepositOnly: dto.isFirstDepositOnly,
      },
      startTime: dto.startTime ? new Date(dto.startTime) : null,
      endTime: dto.endTime ? new Date(dto.endTime) : null,
      updatedBy: adminId,
      translations,
      goals,
      rewards,
    });

    // 3. Repository에 위임
    const questId = await this.questMasterRepository.save(questMaster);

    // 4. 아이콘 파일 확정 및 URL 업데이트
    if (dto.iconFileId) {
      const { files } = await this.attachFileService.execute({
        fileIds: [BigInt(dto.iconFileId)],
        usageType: FileUsageType.QUEST_ICON,
        usageId: questId,
      });

      const publicIconUrl = await this.fileUrlService.getUrl(files[0]);

      // 엔티티의 iconUrl 업데이트 후 재저장
      questMaster.update({ iconUrl: publicIconUrl ?? null });
      await this.questMasterRepository.save(questMaster);
    }

    return questId;
  }
}
