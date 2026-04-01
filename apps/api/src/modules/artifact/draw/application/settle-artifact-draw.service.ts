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
import { CreateUniversalLogService } from 'src/modules/universal-log/application/create-universal-log.service';
import { ArtifactPolicyRepositoryPort } from '../../master/ports/artifact-policy.repository.port';
import { AdvisoryLockService } from 'src/infrastructure/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/infrastructure/concurrency/concurrency.constants';
import { SolanaBlockhashMissingException } from '../domain/draw.exception';

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
    private readonly universalLogService: CreateUniversalLogService,
    private readonly policyRepo: ArtifactPolicyRepositoryPort,
    private readonly lockService: AdvisoryLockService,
  ) { }

  /**
   * 지정된 슬롯의 블록해시를 획득하여 결과를 산출합니다.
   */
  @Transactional()
  async execute(requestId: bigint): Promise<boolean> {
    // 0. 동시성 제어 (Request ID 기반 락)
    await this.lockService.acquireLock(LockNamespace.ARTIFACT_SETTLE, requestId.toString());

    const request = await this.drawRequestRepo.findById(requestId);

    // 1. 대상 확인 (PENDING 상태만 처리)
    if (!request || request.status !== ArtifactDrawStatus.PENDING) {
      return false;
    }

    // 2. 전체 뽑기 분량에 필요한 '실제' 확정 슬롯 목록 조회 (Skip 대응)
    const drawCount = this.policy.getDrawCount(request.drawType);
    let confirmedSlots: number[];
    try {
      // 넉넉한 범위(뽑기 횟수의 3배) 안에서 확정된 슬롯들을 찾습니다.
      confirmedSlots = await this.solanaService.getBlocks(
        Number(request.targetSlot),
        Number(request.targetSlot) + drawCount * 3
      );
    } catch (error: any) {
      if (error.message.includes('rate limit exceeded')) {
        this.logger.warn(`Solana RPC rate limit exceeded during getBlocks for request ${requestId}. Will retry later.`);
        return false;
      }
      throw error;
    }

    // 아직 필요한 만큼의 블록이 생성/확정되지 않았으면 대기
    if (confirmedSlots.length < drawCount) {
      this.logger.debug(`Not enough confirmed blocks yet. Need ${drawCount}, found ${confirmedSlots.length} (Target: ${request.targetSlot})`);
      return false;
    }

    // 앞부분부터 필요한 개수만큼 슬롯 번호를 확정합니다.
    const targetSlots = confirmedSlots.slice(0, drawCount);
    const lastResultSlot = targetSlots[drawCount - 1];

    this.logger.log(`Settling draw request ${requestId} for ${drawCount} items (Actual slots: ${targetSlots[0]} ~ ${lastResultSlot})`);

    // 3. 확률 설정 및 아이템 풀 로드
    const configs = await this.configRepo.findAll();
    const catalogPool = await this.catalogRepo.findAll();
    const results: ArtifactDrawResult[] = [];

    let mainBlockhash: string | null = null;

    // 4. 결정적(Deterministic) 결과 산출 (각 실제 확정 슬롯별 고유 블록해시 사용)
    for (let i = 0; i < drawCount; i++) {
      const itemSlot = targetSlots[i];
      let itemBlockhash: string | null = null;

      try {
        itemBlockhash = await this.solanaService.getBlockHashBySlot(itemSlot);
      } catch (error: any) {
        if (error.message.includes('rate limit exceeded')) {
          this.logger.warn(`Solana RPC rate limit exceeded during getBlockHashBySlot for request ${requestId}. Aborting loop, will retry later.`);
          return false;
        }
        throw error;
      }

      if (!itemBlockhash) {
        this.logger.error(`Failed to fetch blockhash for expected slot: ${itemSlot}`);
        throw new SolanaBlockhashMissingException(itemSlot);
      }

      if (i === 0) mainBlockhash = itemBlockhash;

      const itemSeed = itemBlockhash; // 더 이상 인덱스를 붙일 필요가 없음 (블록해시 자체가 유니크)

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
        blockhash: itemBlockhash, // 각 아이템이 자신의 고유 검증 해시를 가짐
        userArtifactId: savedItem.id,
        artifactCode: artifact.code,
        grade: artifact.grade,
        roll: remappedRoll,
      });
    }

    // 5. 요청 상태 업데이트 (SETTLED)
    request.settle(results);
    await this.drawRequestRepo.save(request);

    // 6. [Universal Log] 최종 결과 기록 (데이터 분석 및 백오피스용)
    const artifactPolicy = await this.policyRepo.findPolicy();
    const finalCost =
      artifactPolicy && request.currencyCode
        ? artifactPolicy.getDrawPrice(request.drawType, request.currencyCode)
        : null;

    await this.universalLogService.execute({
      action: 'artifact.draw',
      targetId: request.id,
      actorId: request.userId,
      payload: {
        currencyCode: request.currencyCode || 'TICKET',
        costAmount: finalCost ? finalCost.toNumber() : 0,
        provablyFair: {
          blockhash: mainBlockhash!,
          nonce: 0, // 슬롯 기반이므로 0 디폴트
        },
        items: results.map((r) => ({
          id: r.artifactCode,
          grade: r.grade,
          gradeRoll: r.roll,
        })),
      },
    });

    this.logger.log(`Successfully settled draw request ${requestId}. Items: ${results.length}`);
    return true;
  }
}
