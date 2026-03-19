import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';

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
