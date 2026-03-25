import { ArtifactPolicy } from '../domain/artifact-policy.entity';

export const ARTIFACT_POLICY_REPOSITORY_PORT = Symbol('ARTIFACT_POLICY_REPOSITORY_PORT');

export interface ArtifactPolicyRepositoryPort {
  findPolicy(): Promise<ArtifactPolicy | null>;
  savePolicy(policy: ArtifactPolicy): Promise<void>;
}
