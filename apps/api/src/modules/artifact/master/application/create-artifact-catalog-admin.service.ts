import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ArtifactCatalogRepositoryPort } from '../ports/artifact-catalog.repository.port';
import { ArtifactCatalog } from '../domain/artifact-catalog.entity';
import { AttachFileService } from 'src/modules/file/application/attach-file.service';
import { FileUrlService } from 'src/modules/file/application/file-url.service';
import { FileUsageType } from 'src/modules/file/domain/model/file-usage.type';
import { ArtifactCatalogAlreadyExistsException } from '../domain/master.exception';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { ArtifactGrade } from '@prisma/client';

export interface CreateArtifactCatalogAdminCommand {
  code: string;
  grade: ArtifactGrade;
  drawWeight: number;
  casinoBenefit: number;
  slotBenefit: number;
  sportsBenefit: number;
  minigameBenefit: number;
  badBeatBenefit: number;
  criticalBenefit: number;
  fileId?: string;
}

/**
 * [Artifact Admin] 유물 카탈로그 신규 등록 서비스
 *
 * 유물을 신규 등록합니다. ID는 DB에서 자동 생성됩니다.
 */
@Injectable()
export class CreateArtifactCatalogAdminService {
  constructor(
    private readonly repository: ArtifactCatalogRepositoryPort,
    private readonly attachFileService: AttachFileService,
    private readonly fileUrlService: FileUrlService,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  @Transactional()
  async execute(command: CreateArtifactCatalogAdminCommand): Promise<ArtifactCatalog> {
    // 0. 동시성 제어: 동일 코드에 대한 생성 요청 잠금
    await this.advisoryLockService.acquireLock(LockNamespace.ARTIFACT_MASTER, command.code);

    // 1. 코드 중복 확인 (락 획득 후 안전하게 확인)
    const existing = await this.repository.findByCode(command.code);
    if (existing) {
      throw new ArtifactCatalogAlreadyExistsException(command.code);
    }

    // 2. 신규 엔티티 초기 생성 (ID는 0n으로 시작)
    const artifact = ArtifactCatalog.create({
      code: command.code,
      grade: command.grade,
      drawWeight: command.drawWeight,
      stats: {
        casinoBenefit: command.casinoBenefit,
        slotBenefit: command.slotBenefit,
        sportsBenefit: command.sportsBenefit,
        minigameBenefit: command.minigameBenefit,
        badBeatBenefit: command.badBeatBenefit,
        criticalBenefit: command.criticalBenefit,
      },
    });

    // 3. 1차 저장 (ID 생성 유도)
    let savedArtifact = await this.repository.save(artifact);

    // 4. 파일 처리 (이미지가 제공된 경우)
    if (command.fileId) {
      const { files } = await this.attachFileService.execute({
        fileIds: [command.fileId],
        usageType: FileUsageType.ARTIFACT_CATALOG_IMAGE,
        usageId: savedArtifact.id,
      });

      if (files.length > 0) {
        const imageUrl = await this.fileUrlService.getUrl(files[0]);
        // 이미지 주소 업데이트 후 2차 저장
        savedArtifact.updateImageUrl(imageUrl);
        savedArtifact = await this.repository.save(savedArtifact);
      }
    }

    return savedArtifact;
  }
}
