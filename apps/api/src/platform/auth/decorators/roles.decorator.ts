import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { UserRoleType } from '@repo/database';

export const IS_PUBLIC_KEY = 'isPublic';
export const GUEST_ONLY_KEY = 'guestOnly';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const GuestOnly = () => SetMetadata(GUEST_ONLY_KEY, true);
export const RequireRoles = (...aud: Array<UserRoleType>) =>
  SetMetadata(ROLES_KEY, aud);
export const Perms = (...perms: string[]) =>
  SetMetadata(PERMISSIONS_KEY, perms);
export const AuthAll = (...p: string[]) =>
  applyDecorators(
    ApiCookieAuth(),
    RequireRoles(
      UserRoleType.USER,
      UserRoleType.AGENT,
      UserRoleType.ADMIN,
      UserRoleType.SUPER_ADMIN,
    ),
    Perms(...p),
  );
