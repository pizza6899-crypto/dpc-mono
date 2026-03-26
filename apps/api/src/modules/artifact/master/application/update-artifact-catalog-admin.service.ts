import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ArtifactCatalogRepositoryPort } from '../ports/artifact-catalog.repository.port';
import { ArtifactCatalog } from '../domain/artifact-catalog.entity';
import { AttachFileService } from 'src/modules/file/application/attach-file.service';
import { FileUrlService } from 'src/modules/file/application/file-url.service';
import { FileUsageType } from 'src/modules/file/domain/model/file-usage.type';
import { ArtifactCatalogAlreadyExistsException, ArtifactCatalogNotFoundException } from '../domain/master.exception';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { ArtifactGrade } from '@prisma/client';

export interface UpdateArtifactCatalogAdminCommand {
  id: bigint;
  code?: string;
  grade?: ArtifactGrade;
  drawWeight?: number;
  casinoBenefit?: number;
  slotBenefit?: number;
  sportsBenefit?: number;
  minigameBenefit?: number;
  badBeatBenefit?: number;
  criticalBenefit?: number;
  fileId?: string;
}

/**
 * [Artifact Admin] 유물 카탈로그 정보 수정 서비스
 */
@Injectable()
export class UpdateArtifactCatalogAdminService {
  constructor(
    private readonly repository: ArtifactCatalogRepositoryPort,
    private readonly attachFileService: AttachFileService,
    private readonly fileUrlService: FileUrlService,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  @Transactional()
  async execute(command: UpdateArtifactCatalogAdminCommand): Promise<ArtifactCatalog> {
    // 1. 기존 유물 존재 확인
    const artifact = await this.repository.findById(command.id);
    if (!artifact) {
      throw new ArtifactCatalogNotFoundException();
    }

    // 2. 동시성 제어 (새로 사용하려는 코드 또는 현재 코드 기준)
    const finalCode = command.code ?? artifact.code;
    await this.advisoryLockService.acquireLock(LockNamespace.ARTIFACT_MASTER, finalCode);

    // 3. 코드 중복 확인 (코드가 변경된 경우에만)
    if (command.code && command.code !== artifact.code) {
      const existing = await this.repository.findByCode(command.code);
      if (existing) {
        throw new ArtifactCatalogAlreadyExistsException(command.code);
      }
    }

    // 4. 엔티티 정보 업데이트 (입력값이 없으면 기존값 유지)
    artifact.update({
      code: finalCode,
      grade: command.grade ?? artifact.grade,
      drawWeight: command.drawWeight ?? artifact.drawWeight,
      stats: {
        casinoBenefit: command.casinoBenefit ?? artifact.statsSummary.casinoBenefit,
        slotBenefit: command.slotBenefit ?? artifact.statsSummary.slotBenefit,
        sportsBenefit: command.sportsBenefit ?? artifact.statsSummary.sportsBenefit,
        minigameBenefit: command.minigameBenefit ?? artifact.statsSummary.minigameBenefit,
        badBeatBenefit: command.badBeatBenefit ?? artifact.statsSummary.badBeatBenefit,
        criticalBenefit: command.criticalBenefit ?? artifact.statsSummary.criticalBenefit,
      },
    });

    // 5. 파일 처리 (신규 이미지가 제공된 경우)
    if (command.fileId) {
      const { files } = await this.attachFileService.execute({
        fileIds: [command.fileId],
        usageType: FileUsageType.ARTIFACT_CATALOG_IMAGE,
        usageId: artifact.id,
      });

      if (files.length > 0) {
        const imageUrl = await this.fileUrlService.getUrl(files[0]);
        artifact.updateImageUrl(imageUrl);
      }
    }

    // 6. 최종 저장
    return await this.repository.save(artifact);
  }
}
