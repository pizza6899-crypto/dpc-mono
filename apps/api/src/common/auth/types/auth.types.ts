import type { UserRoleType, Language } from '@prisma/client';

export interface AuthenticatedUser {
  id: bigint;
  email: string;
  role: UserRoleType;
  language: Language;
}
