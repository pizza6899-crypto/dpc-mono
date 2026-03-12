import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { QUEST_MASTER_REPOSITORY_TOKEN } from '../../core/ports/quest-master.repository.token';
import type { QuestMasterRepository } from '../../core/ports/quest-master.repository.port';
import { UpdateQuestAdminDto } from '../controllers/dto/request/update-quest-admin.dto';
import { QuestMaster, QuestGoal, QuestReward, QuestTranslation } from '../../core/domain/models';
import { QuestNotFoundException } from '../../core/domain/quest-core.exception';
import { GetFileService } from '../../../file/application/get-file.service';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { AttachFileService } from '../../../file/application/attach-file.service';
import { FileUsageType } from '../../../file/domain';
import { EnvService } from 'src/common/env/env.service';

@Injectable()
export class UpdateQuestAdminService {
  constructor(
    @Inject(QUEST_MASTER_REPOSITORY_TOKEN)
    private readonly questMasterRepository: QuestMasterRepository,
    private readonly getFileService: GetFileService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly attachFileService: AttachFileService,
    private readonly envService: EnvService,
  ) { }

  @Transactional()
  async execute(id: bigint, dto: UpdateQuestAdminDto, adminId: bigint): Promise<void> {
    // 0. 동시성 제어 (동일 퀘스트에 대한 어드민 중복 수정 방지)
    await this.advisoryLockService.acquireLock(LockNamespace.QUEST_MASTER, id.toString());

    // 1. 파일 유효성 검사 및 확정
    let iconUrl: string | undefined;
    if (dto.metadata?.iconFileId) {
      const iconFileId = BigInt(dto.metadata.iconFileId);
      await this.getFileService.getById(iconFileId);

      const { files } = await this.attachFileService.execute({
        fileIds: [dto.metadata.iconFileId],
        usageType: FileUsageType.QUEST_ICON,
        usageId: id,
      });
      iconUrl = files[0].publicUrl(this.envService.app.cdnUrl) ?? undefined;
    }
    // 1. 기존 퀘스트 존재 여부 확인
    const existing = await this.questMasterRepository.findById(id);
    if (!existing) {
      throw new QuestNotFoundException(id);
    }

    // 2. 하위 도메인 엔티티 재생성 (UpdateDto의 값을 기반으로 교체하거나 기존값 유지)
    const translations = dto.translations
      ? dto.translations.map(t => QuestTranslation.create({
        language: t.language,
        title: t.title,
        description: t.description,
      }))
      : existing.translations;

    const goals = dto.goals
      ? dto.goals.map(g => QuestGoal.create({
        currency: g.currency,
        targetAmount: g.targetAmount,
        targetCount: g.targetCount,
        matchRule: g.matchRule,
      }))
      : existing.goals;

    const rewards = dto.rewards
      ? dto.rewards.map(r => QuestReward.create({
        type: r.type,
        currency: r.currency,
        value: r.value,
        expireDays: r.expireDays,
        wageringMultiplier: r.wageringMultiplier,
      }))
      : existing.rewards;

    // 3. 도메인 엔티티 업데이트
    const updatedQuest = QuestMaster.fromPersistence({
      id: existing.id,
      type: dto.type ?? existing.type,
      category: dto.category ?? existing.category,
      resetCycle: dto.resetCycle ?? existing.resetCycle,
      maxAttempts: dto.maxAttempts !== undefined ? dto.maxAttempts : existing.maxAttempts,
      isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      parentId: dto.parentId !== undefined ? (dto.parentId ? BigInt(dto.parentId) : null) : existing.parentId,
      precedingId: dto.precedingId !== undefined ? (dto.precedingId ? BigInt(dto.precedingId) : null) : existing.precedingId,
      metadata: dto.metadata ? {
        ...existing.metadata,
        ...dto.metadata,
        iconFileId: dto.metadata.iconFileId ? BigInt(dto.metadata.iconFileId) : existing.metadata.iconFileId,
        iconUrl: iconUrl ?? existing.metadata.iconUrl,
      } : existing.metadata,
      entryRule: dto.entryRule ?? existing.entryRule,
      updatedBy: adminId,
      startTime: dto.startTime ? new Date(dto.startTime) : existing.startTime,
      endTime: dto.endTime ? new Date(dto.endTime) : existing.endTime,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
      translations,
      goals,
      rewards,
    });

    // 4. 저장 (Repository 내부에서 교체 로직 수행)
    await this.questMasterRepository.save(updatedQuest);
  }
}
