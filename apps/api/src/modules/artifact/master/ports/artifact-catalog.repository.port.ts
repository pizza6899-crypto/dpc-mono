import { ArtifactCatalog } from '../domain/artifact-catalog.entity';

export abstract class ArtifactCatalogRepositoryPort {
  abstract findAll(): Promise<ArtifactCatalog[]>;
  abstract findByCode(code: string): Promise<ArtifactCatalog | null>;
  abstract findById(id: bigint): Promise<ArtifactCatalog | null>;
}
