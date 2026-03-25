import { ArtifactPolicy } from '../domain/artifact-policy.entity';

export abstract class ArtifactPolicyRepositoryPort {
  abstract findPolicy(): Promise<ArtifactPolicy | null>;
}
