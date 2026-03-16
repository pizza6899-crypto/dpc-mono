import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { QUEST_MASTER_REPOSITORY_TOKEN } from '../../core/ports/quest-master.repository.token';
import type { QuestMasterRepository } from '../../core/ports/quest-master.repository.port';
import { UpdateQuestAdminDto } from '../controllers/dto/request/update-quest-admin.dto';
import { QuestGoal, QuestReward, QuestTranslation } from '../../core/domain/models';
import { AdminQuestNotFoundException } from '../domain/quest-admin.exception';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { AttachFileService } from '../../../file/application/attach-file.service';
import { FileUsageType } from '../../../file/domain';
import { FileUrlService } from '../../../file/application/file-url.service';

/**
 * 서비스 내부에서 사용할 수정 명령 타입입니다.
 */
export type UpdateQuestAdminCommand = Omit<UpdateQuestAdminDto, 'iconFileId' | 'parentId' | 'precedingId'> & {
  iconFileId?: bigint | null;
  parentId?: bigint | null;
  precedingId?: bigint | null;
};

@Injectable()
export class UpdateQuestAdminService {
  constructor(
    @Inject(QUEST_MASTER_REPOSITORY_TOKEN)
    private readonly questMasterRepository: QuestMasterRepository,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly attachFileService: AttachFileService,
    private readonly fileUrlService: FileUrlService,
  ) { }

  @Transactional()
  async execute(id: bigint, dto: UpdateQuestAdminCommand, adminId: bigint): Promise<void> {
    // 0. 동시성 제어 (동일 퀘스트에 대한 어드민 중복 수정 방지)
    await this.advisoryLockService.acquireLock(LockNamespace.QUEST_MASTER, id.toString());

    // 1. 기존 퀘스트 존재 여부 확인
    const existing = await this.questMasterRepository.findById(id);
    if (!existing) {
      throw new AdminQuestNotFoundException();
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
      }))
      : existing.rewards;

    const oldIconFileId = existing.iconFileId;

    // 3. 도메인 엔티티 업데이트
    existing.update({
      type: dto.type,
      resetCycle: dto.resetCycle,
      maxAttempts: dto.maxAttempts,
      isActive: dto.isActive,
      isHot: dto.isHot !== undefined ? dto.isHot : existing.isHot,
      isNew: dto.isNew !== undefined ? dto.isNew : existing.isNew,
      iconFileId: dto.iconFileId !== undefined ? dto.iconFileId : existing.iconFileId,
      displayOrder: dto.displayOrder !== undefined ? dto.displayOrder : existing.displayOrder,
      parentId: dto.parentId !== undefined ? dto.parentId : undefined,
      precedingId: dto.precedingId !== undefined ? dto.precedingId : undefined,
      entryRule: {
        ...existing.entryRule,
        requireNoWithdrawal: dto.requireNoWithdrawal ?? existing.entryRule.requireNoWithdrawal,
        maxWithdrawalCount: dto.maxWithdrawalCount ?? existing.entryRule.maxWithdrawalCount,
        isFirstDepositOnly: dto.isFirstDepositOnly ?? existing.entryRule.isFirstDepositOnly,
      },
      updatedBy: adminId,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      translations,
      goals,
      rewards,
    });

    // 4. 아이콘 파일 확정 및 URL 업데이트
    // iconFileId가 명시적으로 변경되었을 경우에만 처리
    if (dto.iconFileId !== undefined && dto.iconFileId !== oldIconFileId) {
      if (dto.iconFileId) {
        // 새 파일이 지정된 경우: 파일 사용 확정 및 URL 추출
        const { files } = await this.attachFileService.execute({
          fileIds: [dto.iconFileId],
          usageType: FileUsageType.QUEST_ICON,
          usageId: id,
        });

        const publicIconUrl = await this.fileUrlService.getUrl(files[0]);
        existing.update({ iconUrl: publicIconUrl ?? null });
      } else {
        // null이 명시적으로 전달된 경우: 아이콘 제거
        existing.update({ iconUrl: null });
      }
    }

    // 5. 저장 (Repository 내부에서 교체 로직 수행)
    await this.questMasterRepository.save(existing);
  }
}
