import { ArtifactCatalog } from '../domain/artifact-catalog.entity';

export const ARTIFACT_CATALOG_REPOSITORY_PORT = Symbol('ARTIFACT_CATALOG_REPOSITORY_PORT');

export interface ArtifactCatalogRepositoryPort {
  findAll(): Promise<ArtifactCatalog[]>;
  findById(id: bigint): Promise<ArtifactCatalog | null>;
  findByCode(code: string): Promise<ArtifactCatalog | null>;
  save(catalog: ArtifactCatalog): Promise<void>;
}
