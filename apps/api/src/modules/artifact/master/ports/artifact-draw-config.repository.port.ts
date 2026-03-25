import { ArtifactDrawConfig } from '../domain/artifact-draw-config.entity';

export abstract class ArtifactDrawConfigRepositoryPort {
  abstract findAll(): Promise<ArtifactDrawConfig[]>;
}
