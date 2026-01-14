// src/platform/auth/strategies/session.serializer.ts
import { Injectable, Inject } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UserStatus, UserRoleType, Language } from '@repo/database';
import { AuthenticatedUser } from '../types/auth.types';
import { USER_SESSION_REPOSITORY } from 'src/modules/auth/session/ports/out';
import type { UserSessionRepositoryPort } from 'src/modules/auth/session/ports/out';

interface UserForSerialization {
  id: string; // bigint를 문자열로 변환하여 저장
  uid: string;
  email: string;
  role: UserRoleType;
  status: UserStatus;
  language: Language;
}

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(
    @Inject(USER_SESSION_REPOSITORY)
    private readonly sessionRepository: UserSessionRepositoryPort,
  ) {
    super();
  }

  serializeUser(
    user: AuthenticatedUser,
    done: (err: Error | null, payload?: UserForSerialization) => void,
  ) {
    // 세션에 필요한 모든 정보 저장 (DB 쿼리 제거)
    // status는 로그인 시점의 값이지만, 세션 만료 시 재검증됨
    const serializedUser: UserForSerialization = {
      id: user.id.toString(),
      uid: user.uid,
      email: user.email,
      role: user.role,
      status: UserStatus.ACTIVE, // 로그인 시점에는 항상 ACTIVE
      language: user.language,
    };

    done(null, serializedUser);
  }

  async deserializeUser(
    payload: UserForSerialization,
    done: (err: Error | null, user?: AuthenticatedUser | false) => void,
    req?: any, // express Request 객체 (passport에서 제공)
  ) {
    // 1. 세션 ID로 세션 유효성 검증 (DB 세션 상태 확인)
    if (req?.sessionID) {
      try {
        const session = await this.sessionRepository.findBySessionId(
          req.sessionID,
        );

        // 세션이 없거나 종료된 경우 인증 실패
        if (!session || !session.isActive()) {
          return done(null, false);
        }

        // 보안 검증: 세션의 userId와 payload.id가 일치해야 함
        if (session.userId.toString() !== payload.id) {
          return done(null, false);
        }
      } catch (error) {
        // 세션 조회 실패 시 인증 실패 처리
        return done(null, false);
      }
    }

    // 2. 세션에 저장된 정보를 사용 (DB 쿼리 없음)
    // 세션 유효성은 이미 DB 세션 테이블에서 확인했으므로 추가 쿼리 불필요
    if (payload.status !== UserStatus.ACTIVE) {
      return done(null, false);
    }

    // 세션에 저장된 정보를 사용하여 AuthenticatedUser 생성
    const authUser: AuthenticatedUser = {
      id: BigInt(payload.id),
      uid: payload.uid,
      email: payload.email,
      role: payload.role,
      language: payload.language,
    };

    done(null, authUser);
  }
}
