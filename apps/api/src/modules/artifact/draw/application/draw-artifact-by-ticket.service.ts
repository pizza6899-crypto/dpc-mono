import { Injectable } from '@nestjs/common';
import { ArtifactGrade } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService } from 'src/common/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/common/concurrency/concurrency.constants';
import { UserArtifactStatusRepositoryPort } from '../../status/ports/user-artifact-status.repository.port';
import { ArtifactDrawConfigRepositoryPort } from '../../master/ports/artifact-draw-config.repository.port';
import { ArtifactCatalogRepositoryPort } from '../../master/ports/artifact-catalog.repository.port';
import { UserArtifactRepositoryPort } from '../../inventory/ports/user-artifact.repository.port';
import { UserArtifact } from '../../inventory/domain/user-artifact.entity';
import { CreateUserArtifactLogService } from '../../audit/application/create-user-artifact-log.service';
import { ArtifactStatusNotFoundException } from '../../status/domain/status.exception';
import { ArtifactDrawPolicy } from '../domain/artifact-draw.policy';
import { DrawnArtifact } from './draw-artifact.service';

export interface TicketDrawCommand {
  userId: bigint;
  type: 'SINGLE' | 'TEN';
  ticketType: 'ALL' | ArtifactGrade;
}

/**
 * [Artifact Draw] 티켓 소모 유물 뽑기 서비스
 */
@Injectable()
export class DrawArtifactByTicketService {
  constructor(
    private readonly lockService: AdvisoryLockService,
    private readonly userStatusRepo: UserArtifactStatusRepositoryPort,
    private readonly userInventoryRepo: UserArtifactRepositoryPort,
    private readonly drawConfigRepo: ArtifactDrawConfigRepositoryPort,
    private readonly catalogRepo: ArtifactCatalogRepositoryPort,
    private readonly auditLogService: CreateUserArtifactLogService,
    private readonly drawPolicy: ArtifactDrawPolicy,
  ) { }

  @Transactional()
  async execute(command: TicketDrawCommand): Promise<{ items: DrawnArtifact[] }> {
    const { userId, type, ticketType } = command;

    await this.lockService.acquireLock(LockNamespace.ARTIFACT_DRAW, userId.toString());

    const userStatus = await this.userStatusRepo.findByUserId(userId);
    if (!userStatus) {
      throw new ArtifactStatusNotFoundException();
    }

    const count = this.drawPolicy.getDrawCount(type);
    const spendCount = type === 'SINGLE' ? 1 : 10;

    // 차감 전 수량 획득
    const beforeCount = ticketType === 'ALL'
      ? userStatus.ticketAllCount
      : userStatus.getGradeTicketCount(ticketType as ArtifactGrade);

    // 1. 티켓 소모 및 상태 업데이트
    userStatus.spendTickets(ticketType, spendCount);
    await this.userStatusRepo.update(userStatus);

    // 차감 후 수량 획득
    const afterCount = ticketType === 'ALL'
      ? userStatus.ticketAllCount
      : userStatus.getGradeTicketCount(ticketType as ArtifactGrade);

    // 2. 뽑기 실행
    const drawConfigs = await this.drawConfigRepo.findAll();
    const activeArtifacts = await this.catalogRepo.findAll();

    const results: DrawnArtifact[] = [];
    const logItems: { id: string; grade: ArtifactGrade }[] = [];
    const guaranteedGrade = ticketType !== 'ALL' ? (ticketType as ArtifactGrade) : undefined;

    for (let i = 0; i < count; i++) {
      // 등급 결정
      const grade = this.drawPolicy.rollGrade(drawConfigs, guaranteedGrade);

      // 유물 선택
      const selectedArtifact = this.drawPolicy.selectArtifactFromPool(activeArtifacts, grade);

      // 인벤토리 저장
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
      userId,
      type: 'COUPON_DRAW',
      details: {
        ticketType: ticketType,
        beforeCount,
        afterCount,
        items: logItems,
      },
    });

    return { items: results };
  }
}
