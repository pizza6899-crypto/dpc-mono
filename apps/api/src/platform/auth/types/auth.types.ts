import { UserRoleType } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRoleType;
}
