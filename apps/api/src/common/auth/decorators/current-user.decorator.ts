import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { AuthenticatedUser } from '../types/auth.types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const type = ctx.getType<'http' | 'ws'>();

    if (type === 'http') {
      const request = ctx.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;

      // 사용자 데이터가 없으면 undefined 반환
      if (!user) {
        return undefined;
      }

      const sessionId = request.sessionID; // 패스포트 세션 ID

      return {
        ...user,
        sessionId,
      };
    }

    if (type === 'ws') {
      const client = ctx.switchToWs().getClient();
      const user = client.user as AuthenticatedUser;

      // 사용자 데이터가 없으면 undefined 반환
      if (!user) {
        return undefined;
      }

      const sessionId = client.sessionID; // WebSocket 세션 ID (있는 경우)

      return {
        ...user,
        sessionId,
      };
    }

    return undefined;
  },
);
