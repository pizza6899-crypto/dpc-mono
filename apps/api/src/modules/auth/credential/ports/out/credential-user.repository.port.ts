import type { CredentialUser } from '../../domain';

export interface CredentialUserRepositoryPort {
  findByEmail(email: string): Promise<CredentialUser | null>;
}
