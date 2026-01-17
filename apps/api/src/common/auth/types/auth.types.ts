import type { UserRoleType, Language } from 'src/generated/prisma';

export interface AuthenticatedUser {
  id: bigint;
  email: string;
  role: UserRoleType;
  language: Language;
}
