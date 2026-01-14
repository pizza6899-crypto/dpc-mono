import type { UserRoleType, Language } from '@repo/database';

export interface AuthenticatedUser {
  id: bigint;
  email: string;
  role: UserRoleType;
  language: Language;
}
