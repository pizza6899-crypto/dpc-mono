// src/platform/auth/strategies/session.serializer.ts
import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import { AuthenticatedUser } from '../types/auth.types';
import { SessionService } from '../../session/session.service';

interface UserForSerialization {
  id: string;
}

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(
    private prisma: PrismaService,
    private sessionService: SessionService,
  ) {
    super();
  }

  serializeUser(
    user: AuthenticatedUser,
    done: (err: Error | null, id?: UserForSerialization) => void,
  ) {
    // 세션에는 userId만 저장
    const serializedUser = { id: user.id };
    done(null, serializedUser);
  }

  async deserializeUser(
    payload: UserForSerialization,
    done: (err: Error | null, user?: AuthenticatedUser | false) => void,
    req?: any, // express Request 객체 (passport에서 제공)
  ) {
    try {
      // 1. 세션 ID로 세션 유효성 검증
      if (req?.sessionID) {
        const isValidSession = await this.sessionService.validateSession(
          req.sessionID,
        );
        if (!isValidSession) {
          return done(null, false);
        }
      }

      // 2. userId로 사용자 정보 조회
      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        return done(null, false);
      }

      const authUser: AuthenticatedUser = {
        id: user.id,
        email: user.email || '',
        role: user.role,
      };

      done(null, authUser);
    } catch (error) {
      done(error instanceof Error ? error : new Error('Unknown error'), false);
    }
  }
}
