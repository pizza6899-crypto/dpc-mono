import { UserArtifact } from '../domain/user-artifact.entity';

export const USER_ARTIFACT_REPOSITORY_PORT = Symbol('USER_ARTIFACT_REPOSITORY_PORT');

export interface UserArtifactRepositoryPort {
  findByUserId(userId: bigint): Promise<UserArtifact[]>;
  findById(id: bigint): Promise<UserArtifact | null>;
  findEquippedByUserId(userId: bigint): Promise<UserArtifact[]>;
  save(artifact: UserArtifact): Promise<void>;
  create(artifact: UserArtifact): Promise<void>;
}
