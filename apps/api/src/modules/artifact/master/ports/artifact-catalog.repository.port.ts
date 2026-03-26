import { ArtifactCatalog } from '../domain/artifact-catalog.entity';
import { ArtifactGrade, ArtifactCatalogStatus } from '@prisma/client';

/**
 * [Artifact Admin] 유물 카탈로그 조회를 위한 검색 조건 옵션
 */
export interface ArtifactCatalogSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  code?: string;
  grades?: ArtifactGrade[];
  statuses?: ArtifactCatalogStatus[];
  minWeight?: number;
  maxWeight?: number;
  startDate?: string;
  endDate?: string;
}

export abstract class ArtifactCatalogRepositoryPort {
  abstract findAll(): Promise<ArtifactCatalog[]>;
  abstract findByCode(code: string): Promise<ArtifactCatalog | null>;
  abstract findById(id: bigint): Promise<ArtifactCatalog | null>;
  abstract findManyAndCount(
    options: ArtifactCatalogSearchOptions,
  ): Promise<{ items: ArtifactCatalog[]; total: number }>;
  abstract save(artifact: ArtifactCatalog): Promise<ArtifactCatalog>;
}
