import { Injectable } from '@nestjs/common';
import { ArtifactCatalogRepositoryPort } from '../ports/artifact-catalog.repository.port';
import { ArtifactCatalogNotFoundException } from '../domain/master.exception';

@Injectable()
export class DeleteArtifactCatalogAdminService {
  constructor(
    private readonly repository: ArtifactCatalogRepositoryPort,
  ) { }

  async execute(id: bigint): Promise<void> {
    // 1. 기존 유물 존재 확인
    const artifact = await this.repository.findById(id);
    if (!artifact) {
      throw new ArtifactCatalogNotFoundException();
    }

    // 2. 삭제 실행 (논리 삭제 처리)
    await this.repository.delete(id);
  }
}
