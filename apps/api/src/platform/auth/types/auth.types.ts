import type { UserRoleType } from '@repo/database';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRoleType;
}
