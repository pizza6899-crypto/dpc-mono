import { Injectable } from '@nestjs/common';
import { ArtifactGrade, ExchangeCurrencyCode } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService } from 'src/infrastructure/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/infrastructure/concurrency/concurrency.constants';
import { UserArtifactStatusRepositoryPort } from '../../status/ports/user-artifact-status.repository.port';
import { ArtifactDrawConfigRepositoryPort } from '../../master/ports/artifact-draw-config.repository.port';
import { ArtifactCatalogRepositoryPort } from '../../master/ports/artifact-catalog.repository.port';
import { UserArtifactRepositoryPort } from '../../inventory/ports/user-artifact.repository.port';
import { UserArtifact } from '../../inventory/domain/user-artifact.entity';
import { CreateUniversalLogService } from '../../../universal-log/application/create-universal-log.service';
import { ArtifactStatusNotFoundException } from '../../status/domain/status.exception';
import { ArtifactDrawPolicy } from '../domain/artifact-draw.policy';
import { DrawnArtifact } from './draw-artifact.service';

export interface CurrencyDrawCommand {
  userId: bigint;
  type: 'SINGLE' | 'TEN';
  currency: ExchangeCurrencyCode;
}

/**
 * [Artifact Draw] 재화 소모 유물 뽑기 서비스
 */
@Injectable()
export class DrawArtifactByCurrencyService {
  constructor(
    private readonly lockService: AdvisoryLockService,
    private readonly userStatusRepo: UserArtifactStatusRepositoryPort,
    private readonly userInventoryRepo: UserArtifactRepositoryPort,
    private readonly drawConfigRepo: ArtifactDrawConfigRepositoryPort,
    private readonly catalogRepo: ArtifactCatalogRepositoryPort,
    private readonly auditLogService: CreateUniversalLogService,
    private readonly drawPolicy: ArtifactDrawPolicy,
  ) { }

  @Transactional()
  async execute(command: CurrencyDrawCommand): Promise<{ items: DrawnArtifact[] }> {
    const { userId, type, currency } = command;

    await this.lockService.acquireLock(LockNamespace.ARTIFACT_DRAW, userId.toString());

    const userStatus = await this.userStatusRepo.findByUserId(userId);
    if (!userStatus) {
      throw new ArtifactStatusNotFoundException();
    }

    const count = this.drawPolicy.getDrawCount(type);

    // 1. 재화 소모 및 통계 업데이트
    userStatus.recordCurrencyDraw(type === 'SINGLE' ? 1 : 10);
    // TODO: WalletModule 연동하여 실제 재화 차감 (예: walletService.debit(...))
    console.log(`[TODO] Currency payment logic for ${userId}: ${currency}`);

    await this.userStatusRepo.update(userStatus);

    // 2. 뽑기 실행
    const drawConfigs = await this.drawConfigRepo.findAll();
    const activeArtifacts = await this.catalogRepo.findAll();

    const results: DrawnArtifact[] = [];
    const logItems: { id: string; grade: ArtifactGrade }[] = [];

    for (let i = 0; i < count; i++) {
      // 재화 뽑기는 별도의 확정 등급 없이 확률로만 진행
      const grade = this.drawPolicy.rollGrade(drawConfigs);
      const selectedArtifact = this.drawPolicy.selectArtifactFromPool(activeArtifacts, grade);

      const newUserArtifact = UserArtifact.create(userId, selectedArtifact.id);
      const savedArtifact = await this.userInventoryRepo.save(newUserArtifact);

      // 로그용 정보 수집
      logItems.push({ id: selectedArtifact.id.toString(), grade: selectedArtifact.grade });

      results.push({
        id: savedArtifact.id.toString(),
        artifactId: selectedArtifact.code,
        grade: selectedArtifact.grade,
      });
    }

    // 3. 감사 로그 기록 (일괄 기록)
    await this.auditLogService.execute({
      action: 'artifact.draw',
      userId,
      payload: {
        currencyCode: currency,
        costAmount: count === 1 ? 100 : 1000, // TODO: 실제 가격 정책 연동 필요
        items: logItems.map(item => ({ id: item.id, grade: item.grade })),
      },
    });

    return { items: results };
  }
}
