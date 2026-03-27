import { Injectable } from '@nestjs/common';
import { ArtifactGrade, ExchangeCurrencyCode } from '@prisma/client';
import { InjectTransaction, Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService } from 'src/common/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/common/concurrency/concurrency.constants';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserArtifactStatusRepositoryPort } from '../../status/ports/user-artifact-status.repository.port';
import { ArtifactDrawConfigRepositoryPort } from '../../master/ports/artifact-draw-config.repository.port';
import { ArtifactCatalogRepositoryPort } from '../../master/ports/artifact-catalog.repository.port';
import { CreateUserArtifactLogService } from '../../audit/application/create-user-artifact-log.service';
import { ArtifactStatusNotFoundException } from '../../status/domain/status.exception';
import { ArtifactDrawPolicy } from '../domain/artifact-draw.policy';
import { DrawResultResponseDto } from '../controllers/user/dto/response/draw-result.response.dto';

export interface DrawArtifactCommand {
  userId: bigint;
  type: 'SINGLE' | 'TEN';
  paymentType: 'CURRENCY' | 'TICKET';
  ticketType: 'ALL' | ArtifactGrade;
  currency: ExchangeCurrencyCode;
}

/**
 * [Artifact Draw] 유물 뽑기 실행 서비스
 */
@Injectable()
export class DrawArtifactService {
  constructor(
    private readonly lockService: AdvisoryLockService,
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly userStatusRepo: UserArtifactStatusRepositoryPort,
    private readonly drawConfigRepo: ArtifactDrawConfigRepositoryPort,
    private readonly catalogRepo: ArtifactCatalogRepositoryPort,
    private readonly auditLogService: CreateUserArtifactLogService,
    private readonly drawPolicy: ArtifactDrawPolicy,
  ) { }

  /**
   * [Artifact Draw] 유물 뽑기 실행
   */
  @Transactional()
  async execute(command: DrawArtifactCommand): Promise<DrawResultResponseDto> {
    const { userId, type, paymentType, ticketType } = command;

    // 1. 동시성 제어를 위한 어드바이저리 락 획득 (유저별)
    await this.lockService.acquireLock(LockNamespace.ARTIFACT_DRAW, userId.toString());

    // 2. 유저 상태 조회
    const userStatus = await this.userStatusRepo.findByUserId(userId);
    if (!userStatus) {
      throw new ArtifactStatusNotFoundException();
    }

    const count = this.drawPolicy.getDrawCount(type);

    // 3. 지불 처리 및 통계 업데이트
    if (paymentType === 'TICKET') {
      userStatus.spendTickets(ticketType, type === 'SINGLE' ? 1 : 10);
    } else {
      userStatus.recordCurrencyDraw(type === 'SINGLE' ? 1 : 10);
      // TODO: WalletModule 연동하여 실제 재화 차감 로직 구현
      console.log(`[TODO] Currency payment logic for ${userId}: ${command.currency}`);
    }
    
    // 상태 변경 내역 저장
    await this.userStatusRepo.update(userStatus);

    // 4. 뽑기 실행 (확률 기반 등급 결정 및 유물 선택)
    const drawConfigs = await this.drawConfigRepo.findAll();
    const activeArtifacts = await this.catalogRepo.findAll();

    const results: any[] = [];
    for (let i = 0; i < count; i++) {
      // 등급 결정
      const grade = this.drawPolicy.rollGrade(drawConfigs);
      
      // 유물 선택
      const selectedArtifact = this.drawPolicy.selectArtifactFromPool(activeArtifacts, grade);

      // 인벤토리(UserArtifact) 저장
      const userArtifact = await this.tx.userArtifact.create({
        data: {
          userId,
          artifactId: selectedArtifact.id,
        },
      });

      results.push({
        id: userArtifact.id.toString(),
        artifactId: selectedArtifact.code,
        grade: selectedArtifact.grade,
      });

      // TODO: 등급별 획득 횟수(ObtainCount) 기록 여부 결정 후 추가 예정
    }

    // 5. 감사 로그 기록
    await this.auditLogService.execute({
      userId,
      type: 'DRAW',
      details: {
        isTicketUsed: paymentType === 'TICKET',
        pityApplied: false,
      },
    });

    return {
      items: results,
    };
  }
}
