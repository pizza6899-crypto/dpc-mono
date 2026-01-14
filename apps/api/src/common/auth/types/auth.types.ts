import type { UserRoleType, Language } from '@repo/database';

export interface AuthenticatedUser {
  id: bigint;
  uid: string;
  email: string;
  role: UserRoleType;
  language: Language;
}
