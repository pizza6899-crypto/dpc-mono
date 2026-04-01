import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ArtifactGrade } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/infrastructure/concurrency';
import { RequestContextService } from 'src/infrastructure/cls/request-context.service';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';
import { SolanaService } from 'src/infrastructure/blockchain/solana/solana.service';

import { UserArtifactRepositoryPort } from '../../inventory/ports/user-artifact.repository.port';
import { ArtifactPolicyRepositoryPort } from '../../master/ports/artifact-policy.repository.port';
import { ArtifactCatalogRepositoryPort } from '../../master/ports/artifact-catalog.repository.port';
import { UserArtifactStatusRepositoryPort } from '../../status/ports/user-artifact-status.repository.port';

import { UserArtifact } from '../../inventory/domain/user-artifact.entity';
import { ArtifactSynthesisPolicy } from '../domain/artifact-synthesis.policy';
import {
  InvalidSynthesisIngredientsException,
  SynthesisPolicyNotConfiguredException,
  MaxGradeSynthesisException,
} from '../domain/synthesis.exception';
import { SynthesizeArtifactResponseDto } from '../controllers/user/dto/response/synthesize-artifact.response.dto';
import { CreateUniversalLogService } from 'src/modules/universal-log/application/create-universal-log.service';

/**
 * [Artifact Synthesis] 유물 합성 실행 서비스 (명시적 블록체인 시드 사용)
 */
@Injectable()
export class SynthesizeArtifactService {
  private readonly logger = new Logger(SynthesizeArtifactService.name);

  constructor(
    private readonly requestContext: RequestContextService,
    private readonly lockService: AdvisoryLockService,
    private readonly sqidsService: SqidsService,
    private readonly solanaService: SolanaService,
    private readonly synthesisPolicy: ArtifactSynthesisPolicy,
    private readonly userArtifactRepo: UserArtifactRepositoryPort,
    private readonly userArtifactStatusRepo: UserArtifactStatusRepositoryPort,
    private readonly policyRepo: ArtifactPolicyRepositoryPort,
    private readonly catalogRepo: ArtifactCatalogRepositoryPort,
    private readonly universalLogService: CreateUniversalLogService,
  ) { }

  @Transactional()
  async execute(ingredientSqids: string[]): Promise<SynthesizeArtifactResponseDto> {
    const userId = this.requestContext.getUserId()!;

    // 1. 동시성 제어 (유저의 인벤토리 및 상태 변형 방지)
    await this.lockService.acquireLock(LockNamespace.ARTIFACT_INVENTORY, userId.toString());

    // 2. 재료 유물 조회 및 소유권 확인
    const ingredientIds = ingredientSqids.map(sqid => 
      this.sqidsService.decode(sqid, SqidsPrefix.USER_ARTIFACT)
    );
    
    // 명시적으로 중복된 ID 방지
    if (new Set(ingredientIds).size !== ingredientIds.length) {
      throw new InvalidSynthesisIngredientsException('Duplicate ingredients provided');
    }

    const ingredients: UserArtifact[] = [];
    for (const id of ingredientIds) {
      const artifact = await this.userArtifactRepo.findById(id);
      if (!artifact || artifact.userId !== userId) {
        throw new InvalidSynthesisIngredientsException(`Artifact not found or not owned: ${id}`);
      }
      if (artifact.isEquipped) {
        throw new InvalidSynthesisIngredientsException(`Cannot use equipped artifact as an ingredient: ${id}`);
      }
      ingredients.push(artifact);
    }

    // 3. 등급 통일성 확인
    const currentGrade = ingredients[0].catalog!.grade;
    const isSameGrade = ingredients.every(i => i.catalog!.grade === currentGrade);
    if (!isSameGrade) {
      throw new InvalidSynthesisIngredientsException('All ingredients must have the same grade');
    }

    // UNIQUE(최고 등급)는 더 이상 합성 불가능하다고 판단 (정책에 따라 예외 처리)
    if (currentGrade === ArtifactGrade.UNIQUE) {
      throw new MaxGradeSynthesisException(currentGrade);
    }

    // 4. 합성 정책 및 유저 통계 조회
    const globalPolicy = await this.policyRepo.findPolicy();
    const config = globalPolicy?.synthesisConfigs?.[currentGrade];
    if (!globalPolicy || !config) {
      throw new SynthesisPolicyNotConfiguredException(currentGrade);
    }
    if (ingredients.length !== config.requiredCount) {
      throw new InvalidSynthesisIngredientsException(`Required count is ${config.requiredCount}, but got ${ingredients.length}`);
    }

    let userStatus = await this.userArtifactStatusRepo.findByUserId(userId);
    if (!userStatus) throw new Error(`User status not found for user: ${userId}`);

    const currentFailCount = userStatus.getSynthesisFailCount(currentGrade);

    // 5. 시드 확보 (솔라나 최신 블록해시 획득)
    const currentSlot = await this.solanaService.getCurrentSlot();
    const blockhash = await this.solanaService.getBlockHashBySlot(currentSlot);
    if (!blockhash) {
      throw new Error(`Failed to fetch latest blockhash from Solana for synthesis`);
    }

    // 6. 도메인 정책을 통해 결과(성공 여부, 정규화된 주사위) 산출
    const rollResult = this.synthesisPolicy.rollSynthesis(
      currentGrade,
      config.successRate,
      currentFailCount,
      config.guaranteedCount,
      blockhash,
    );

    // 7. 결과 유물 선택 (Master Catalog 사용)
    const catalogPool = await this.catalogRepo.findAll();
    const rewardCatalog = this.synthesisPolicy.selectArtifactFromPool(
      catalogPool, 
      rollResult.targetGrade, 
      rollResult.remappedRoll
    );

    // 8. DB 인벤토리 반영: 사용된 재료 파기 및 보상 지급
    await this.userArtifactRepo.deleteAll(ingredientIds);
    const newArtifact = UserArtifact.create(userId, rewardCatalog.id);
    const savedArtifact = await this.userArtifactRepo.save(newArtifact);

    // 9. 유저 통계(Pity) 업데이트
    if (rollResult.isSuccess) {
      userStatus.recordSynthesisSuccess(currentGrade);
      // 천장 도달 여부와 무관하게 성공하면 실패 스택(Count) 초기화를 의미함 (명시적 리셋 필요 시 로직 보완)
      // 정책: 보통 성공하면 0으로 리셋하지만, 기존 recordSynthesisSuccess는 누적으로만 되어 있습니다.
      // (기존 Pity를 유지하려면 Status Entity에 fail 카운트 리셋 메서드 추가 필요 - 현재는 단순 증가 방식이므로 우선 그대로 두거나 추후 보완)
    } else {
      userStatus.recordSynthesisFail(currentGrade);
    }
    await this.userArtifactStatusRepo.update(userStatus);

    // 10. Audit Log 기록 
    const encodedRewardId = this.sqidsService.encode(savedArtifact.id, SqidsPrefix.USER_ARTIFACT);
    await this.universalLogService.execute({
      action: 'artifact.synthesis',
      actorId: userId,
      targetId: null, // 자기 자신의 합성 행위
      payload: {
        ingredients: ingredientSqids,
        ingredientCodes: ingredients.map(i => i.catalog!.code),
        baseGrade: currentGrade,
        isSuccess: rollResult.isSuccess,
        isGuaranteed: rollResult.isGuaranteed,
        rewardArtifactCode: rewardCatalog.code,
        rewardGrade: rollResult.targetGrade,
        blockhash: blockhash,
      },
    });

    this.logger.log(`User ${userId} synthesized ${currentGrade} artifacts. Success: ${rollResult.isSuccess}`);

    return {
      isSuccess: rollResult.isSuccess,
      isGuaranteed: rollResult.isGuaranteed,
      currentFailCount: userStatus.getSynthesisFailCount(currentGrade),
      reward: {
        id: encodedRewardId,
        artifactCode: rewardCatalog.code,
        grade: rewardCatalog.grade,
        acquiredAt: savedArtifact.createdAt,
      },
    };
  }
}
