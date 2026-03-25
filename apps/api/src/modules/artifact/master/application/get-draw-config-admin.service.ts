import { Injectable } from '@nestjs/common';
import { ArtifactDrawConfigRepositoryPort } from '../ports/artifact-draw-config.repository.port';
import { ArtifactDrawConfig } from '../domain/artifact-draw-config.entity';

/**
 * [Artifact] 유물 뽑기 확률 설정 전체 조회 서비스 (어드민용)
 */
@Injectable()
export class GetDrawConfigAdminService {
  constructor(
    private readonly drawConfigRepo: ArtifactDrawConfigRepositoryPort,
  ) { }

  /**
   * 모든 등급의 뽑기 확률 설정을 조회하여 반환
   */
  async execute(): Promise<ArtifactDrawConfig[]> {
    return this.drawConfigRepo.findAll();
  }
}
