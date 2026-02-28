import type { CredentialUser } from '../../domain';

export interface CredentialUserRepositoryPort {
  findByLoginId(loginId: string): Promise<CredentialUser | null>;
  findById(id: bigint): Promise<CredentialUser | null>;
}
