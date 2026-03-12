import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { QUEST_MASTER_REPOSITORY_TOKEN } from '../../core/ports/quest-master.repository.token';
import type { QuestMasterRepository } from '../../core/ports/quest-master.repository.port';
import { CreateQuestAdminDto } from '../controllers/dto/request/create-quest-admin.dto';
import { QuestMaster, QuestGoal, QuestReward, QuestTranslation } from '../../core/domain/models';
import { GetFileService } from '../../../file/application/get-file.service';
import { AttachFileService } from '../../../file/application/attach-file.service';
import { FileUsageType } from '../../../file/domain';
import { EnvService } from 'src/common/env/env.service';

@Injectable()
export class CreateQuestAdminService {
  constructor(
    @Inject(QUEST_MASTER_REPOSITORY_TOKEN)
    private readonly questMasterRepository: QuestMasterRepository,
    private readonly getFileService: GetFileService,
    private readonly attachFileService: AttachFileService,
    private readonly envService: EnvService,
  ) { }

  @Transactional()
  async execute(dto: CreateQuestAdminDto, adminId: bigint): Promise<bigint> {
    // 0. 파일 유효성 검사
    let iconUrl: string | undefined;
    if (dto.metadata?.iconFileId) {
      const iconFileId = BigInt(dto.metadata.iconFileId);
      await this.getFileService.getById(iconFileId);
    }
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
      metadata: dto.metadata ? {
        ...dto.metadata,
        iconFileId: dto.metadata.iconFileId ? BigInt(dto.metadata.iconFileId) : undefined,
      } : {},
      entryRule: dto.entryRule ?? {},
      startTime: dto.startTime ? new Date(dto.startTime) : null,
      endTime: dto.endTime ? new Date(dto.endTime) : null,
      updatedBy: adminId,
      translations,
      goals,
      rewards,
    });

    // 3. Repository에 위임 (내부에서 tx 및 중첩 생성 처리)
    const questId = await this.questMasterRepository.save(questMaster);

    // 4. 아이콘 파일 확정 및 URL 업데이트 (필요 시)
    if (dto.metadata?.iconFileId) {
      const { files } = await this.attachFileService.execute({
        fileIds: [dto.metadata.iconFileId],
        usageType: FileUsageType.QUEST_ICON,
        usageId: questId,
      });

      const publicIconUrl = files[0].publicUrl(this.envService.app.cdnUrl) ?? undefined;

      // 퀘스트 메타데이터 다시 업데이트
      questMaster.update({
        metadata: {
          ...questMaster.metadata,
          iconUrl: publicIconUrl,
        },
      });
      await this.questMasterRepository.save(questMaster);
    }

    return questId;
  }
}
