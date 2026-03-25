import { ArtifactPolicy } from '../domain/artifact-policy.entity';

export abstract class ArtifactPolicyRepositoryPort {
  abstract findPolicy(): Promise<ArtifactPolicy | null>;
  abstract save(policy: ArtifactPolicy): Promise<void>;
}
