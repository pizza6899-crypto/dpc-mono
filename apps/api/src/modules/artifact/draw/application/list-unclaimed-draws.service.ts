import { Injectable } from '@nestjs/common';
import { RequestContextService } from 'src/infrastructure/cls/request-context.service';
import { ArtifactDrawRequestRepositoryPort } from '../ports/artifact-draw-request.repository.port';
import { ArtifactDrawRequest } from '../domain/artifact-draw-request.entity';

/**
 * [Artifact Draw] 미확인 뽑기 내역 조회 서비스
 */
@Injectable()
export class ListUnclaimedDrawsService {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly drawRequestRepo: ArtifactDrawRequestRepositoryPort,
  ) { }

  /**
   * 유저별로 서버 결과 확정(SETTLED)이 끝났으나 확인(CLAIMED)하지 않은 내역 조회
   */
  async execute(): Promise<ArtifactDrawRequest[]> {
    const userId = this.requestContext.getUserId()!;
    return await this.drawRequestRepo.findSettledByUserId(userId);
  }
}
