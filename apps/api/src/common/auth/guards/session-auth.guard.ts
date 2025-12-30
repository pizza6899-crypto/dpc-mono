import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  IS_PUBLIC_KEY,
  GUEST_ONLY_KEY,
  ROLES_KEY,
} from '../decorators/roles.decorator';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types/message-codes';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Public 엔드포인트 체크
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. 게스트 전용 엔드포인트 체크
    const isGuestOnly = this.reflector.getAllAndOverride<boolean>(
      GUEST_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isGuestOnly) {
      // 이미 인증된 사용자는 접근 불가
      if (request.isAuthenticated()) {
        throw new ApiException(
          MessageCode.AUTH_ALREADY_AUTHENTICATED_USERS_CANNOT_ACCESS_THIS_ENDPOINT,
          403,
        );
      }
      return true;
    }

    // 3. 일반 엔드포인트 - 인증 필수
    if (!request.isAuthenticated() || !request.user) {
      throw new UnauthorizedException(
        'No active session or invalid credentials',
      );
    }

    // 4. Role 검증
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = (request.user as any).role;
      if (!requiredRoles.includes(userRole)) {
        throw new ApiException(MessageCode.AUTH_INSUFFICIENT_PERMISSIONS, 403);
      }
    }

    return true;
  }
}
