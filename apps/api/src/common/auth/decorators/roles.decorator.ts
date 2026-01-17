import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { UserRoleType } from 'src/generated/prisma';

export const IS_PUBLIC_KEY = 'isPublic';
export const GUEST_ONLY_KEY = 'guestOnly';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const GuestOnly = () => SetMetadata(GUEST_ONLY_KEY, true);

export const RequireRoles = (...aud: Array<UserRoleType>) =>
  applyDecorators(SetMetadata(ROLES_KEY, aud), ApiCookieAuth());

export const Perms = (...perms: string[]) =>
  applyDecorators(SetMetadata(PERMISSIONS_KEY, perms), ApiCookieAuth());

export const AuthAll = (...p: string[]) =>
  applyDecorators(
    RequireRoles(
      UserRoleType.USER,
      UserRoleType.AGENT,
      UserRoleType.ADMIN,
      UserRoleType.SUPER_ADMIN,
    ),
    Perms(...p),
  );

export const Admin = (...p: string[]) =>
  applyDecorators(RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN), Perms(...p));

export const SuperAdmin = (...p: string[]) =>
  applyDecorators(RequireRoles(UserRoleType.SUPER_ADMIN), Perms(...p));
