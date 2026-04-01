import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { RequestContextService } from 'src/infrastructure/cls/request-context.service';
import { ArtifactDrawStatus } from '@prisma/client';
import { SolanaService } from 'src/infrastructure/blockchain/solana/solana.service';
import { ArtifactDrawRequestRepositoryPort } from '../ports/artifact-draw-request.repository.port';
import { ArtifactDrawRequest } from '../domain/artifact-draw-request.entity';
import { SettleArtifactDrawService } from './settle-artifact-draw.service';
import { ArtifactDrawPolicy } from '../domain/artifact-draw.policy';
import {
  ArtifactDrawRequestNotFoundException,
  InvalidDrawStatusException,
  UnauthorizedDrawClaimException,
  DrawNotSettledYetException
} from '../domain/draw.exception';

/**
 * [Artifact Draw] 유물 뽑기 결과 최종 확인 서비스 (Confirm 단계)
 */
@Injectable()
export class ClaimArtifactDrawService {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly solanaService: SolanaService,
    private readonly drawRequestRepo: ArtifactDrawRequestRepositoryPort,
    private readonly settleService: SettleArtifactDrawService,
    private readonly policy: ArtifactDrawPolicy,
  ) { }

  /**
   * 유저가 결과를 시청했음을 기록하여 상태를 CLAIMED로 변경합니다.
   */
  @Transactional()
  async execute(requestId: bigint): Promise<ArtifactDrawRequest> {
    const userId = this.requestContext.getUserId()!;
    const request = await this.drawRequestRepo.findById(requestId);

    // 1. 유효성 검증
    if (!request) {
      throw new ArtifactDrawRequestNotFoundException();
    }

    if (request.userId !== userId) {
      throw new UnauthorizedDrawClaimException();
    }

    // 2. [Real-time Settle] PENDING 상태인 경우 결과 산출 가능 여부 확인 후 즉시 처리
    if (request.status === ArtifactDrawStatus.PENDING) {
      const drawCount = this.policy.getDrawCount(request.drawType);
      const maxRequiredSlot = request.targetSlot + BigInt(drawCount - 1);

      const currentSlot = await this.solanaService.getCurrentSlot();
      if (BigInt(currentSlot) < maxRequiredSlot) {
        throw new DrawNotSettledYetException(); // 아직 마지막 아이템까지의 슬롯 미도달
      }

      // 결과 산출 실행 (Settle)
      const isSettled = await this.settleService.execute(requestId);
      if (!isSettled) {
        throw new DrawNotSettledYetException();
      }

      // 상태가 변경된 최신 정보를 다시 불러옴
      const updatedRequest = await this.drawRequestRepo.findById(requestId);
      if (!updatedRequest) throw new ArtifactDrawRequestNotFoundException();
      return this.finalizeClaim(updatedRequest);
    }

    if (request.status !== ArtifactDrawStatus.SETTLED) {
      throw new InvalidDrawStatusException(request.status);
    }

    return await this.finalizeClaim(request);
  }

  /**
   * 상태를 CLAIMED로 변경하고 저장합니다.
   */
  private async finalizeClaim(request: ArtifactDrawRequest): Promise<ArtifactDrawRequest> {
    request.claim();
    return await this.drawRequestRepo.save(request);
  }
}
