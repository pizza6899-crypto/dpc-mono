import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ArtifactDrawStatus } from '@prisma/client';
import { SolanaService } from 'src/infrastructure/blockchain/solana/solana.service';
import { ArtifactDrawRequestRepositoryPort } from '../ports/artifact-draw-request.repository.port';
import { ArtifactDrawConfigRepositoryPort } from '../../master/ports/artifact-draw-config.repository.port';
import { ArtifactCatalogRepositoryPort } from '../../master/ports/artifact-catalog.repository.port';
import { UserArtifactRepositoryPort } from '../../inventory/ports/user-artifact.repository.port';
import { ArtifactDrawPolicy } from '../domain/artifact-draw.policy';
import { UserArtifact } from '../../inventory/domain/user-artifact.entity';
import { ArtifactDrawResult } from '../domain/artifact-draw-request.entity';

/**
 * [Artifact Draw] 유물 뽑기 결과 확정 서비스 (Reveal/Settle 단계)
 */
@Injectable()
export class SettleArtifactDrawService {
  private readonly logger = new Logger(SettleArtifactDrawService.name);

  constructor(
    private readonly solanaService: SolanaService,
    private readonly drawRequestRepo: ArtifactDrawRequestRepositoryPort,
    private readonly configRepo: ArtifactDrawConfigRepositoryPort,
    private readonly catalogRepo: ArtifactCatalogRepositoryPort,
    private readonly inventoryRepo: UserArtifactRepositoryPort,
    private readonly policy: ArtifactDrawPolicy,
  ) { }

  /**
   * 지정된 슬롯의 블록해시를 획득하여 결과를 산출합니다.
   */
  @Transactional()
  async execute(requestId: bigint): Promise<boolean> {
    const request = await this.drawRequestRepo.findById(requestId);

    // 1. 대상 확인 (PENDING 상태만 처리)
    if (!request || request.status !== ArtifactDrawStatus.PENDING) {
      return false;
    }

    // 2. 솔라나 블록해시 획득 (targetSlot 기준)
    const blockhash = await this.solanaService.getBlockHashBySlot(Number(request.targetSlot));
    if (!blockhash) {
      // 블록이 아직 생성되지 않았거나 RPC 노드 인덱싱 지연 시 재시도 필요
      this.logger.warn(`Blockhash not found yet for slot: ${request.targetSlot} (Request ID: ${requestId})`);
      return false;
    }

    this.logger.log(`Settling draw request ${requestId} using blockhash: ${blockhash}`);

    // 3. 확률 설정 및 아이템 풀 로드
    const configs = await this.configRepo.findAll();
    const catalogPool = await this.catalogRepo.findAll();

    const drawCount = this.policy.getDrawCount(request.drawType);
    const results: ArtifactDrawResult[] = [];

    // 4. 결정적(Deterministic) 결과 산출
    for (let i = 0; i < drawCount; i++) {
      const itemSeed = `${blockhash}_${i}`;

      // 등급 확정권 여부 판단 (ALL인 경우 확률 기반으로 동작)
      const guaranteedGrade = request.ticketType && request.ticketType !== 'ALL'
        ? (request.ticketType as any)
        : undefined;

      // 0~1 난수 1회로 등급과 아이템 모두 결정
      const { grade, remappedRoll } = this.policy.rollGrade(configs, itemSeed, guaranteedGrade);

      // 해당 등급 내에서 유물 선택
      const artifact = this.policy.selectArtifactFromPool(catalogPool, grade, remappedRoll);

      // 인벤토리(UserArtifact) 데이터 생성 및 저장
      const userArtifact = UserArtifact.create(request.userId, artifact.id);
      const savedItem = await this.inventoryRepo.save(userArtifact);

      results.push({
        blockhash, // 각 아이템이 자신의 검증 해시를 가짐
        userArtifactId: savedItem.id,
        artifactCode: artifact.code,
        grade: artifact.grade,
        roll: remappedRoll,
      });
    }

    // 5. 요청 상태 업데이트 (SETTLED)
    request.settle(results);
    await this.drawRequestRepo.save(request);

    this.logger.log(`Successfully settled draw request ${requestId}. Items: ${results.length}`);
    return true;
  }
}
