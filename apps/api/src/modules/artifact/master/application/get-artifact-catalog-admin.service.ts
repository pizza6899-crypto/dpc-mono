import { Injectable } from '@nestjs/common';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { ArtifactCatalogRepositoryPort, ArtifactCatalogSearchOptions } from '../ports/artifact-catalog.repository.port';
import { ArtifactCatalog } from '../domain/artifact-catalog.entity';
import { ArtifactCatalogNotFoundException } from '../domain/master.exception';

/**
 * [Artifact Admin] 유물 카탈로그 조회 서비스
 */
@Injectable()
export class GetArtifactCatalogAdminService {
  constructor(private readonly repository: ArtifactCatalogRepositoryPort) {}

  /**
   * 유물 카탈로그 목록 조회 (필터링 & 페이지네이션)
   */
  async getCatalogs(
    queryBy: ArtifactCatalogSearchOptions,
  ): Promise<PaginatedData<ArtifactCatalog>> {
    const { page = 1, limit = 20 } = queryBy;
    const { items, total } = await this.repository.findManyAndCount(queryBy);

    return {
      data: items,
      total,
      page,
      limit,
    };
  }

  /**
   * 유물 상세 조회
   */
  async getCatalog(id: string): Promise<ArtifactCatalog> {
    const item = await this.repository.findById(BigInt(id));

    if (!item) {
      throw new ArtifactCatalogNotFoundException();
    }

    return item;
  }
}
