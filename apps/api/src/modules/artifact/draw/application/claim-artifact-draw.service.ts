import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { RequestContextService } from 'src/infrastructure/cls/request-context.service';
import { ArtifactDrawStatus } from '@prisma/client';
import { ArtifactDrawRequestRepositoryPort } from '../ports/artifact-draw-request.repository.port';
import { ArtifactDrawRequest } from '../domain/artifact-draw-request.entity';
import { ArtifactDrawRequestNotFoundException, InvalidDrawStatusException, UnauthorizedDrawClaimException } from '../domain/draw.exception';

/**
 * [Artifact Draw] 유물 뽑기 결과 최종 확인 서비스 (Confirm 단계)
 */
@Injectable()
export class ClaimArtifactDrawService {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly drawRequestRepo: ArtifactDrawRequestRepositoryPort,
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

    if (request.status !== ArtifactDrawStatus.SETTLED) {
      throw new InvalidDrawStatusException(request.status);
    }

    // 2. 상태 업데이트 (CLAIMED)
    request.claim();
    
    return await this.drawRequestRepo.save(request);
  }
}
