// src/platform/auth/strategies/session.serializer.ts
import { Injectable, Inject } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import {
  UserStatus,
} from '@prisma/client';
import { AuthenticatedUser } from '../types/auth.types';
import { USER_SESSION_REPOSITORY } from 'src/modules/auth/session/ports/out';
import type { UserSessionRepositoryPort } from 'src/modules/auth/session/ports/out';

/**
 * 세션 직렬화용 인터페이스 (id를 string으로 변환)
 */
interface UserForSerialization extends Omit<AuthenticatedUser, 'id'> {
  id: string; // bigint를 문자열로 변환하여 저장
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
    // 세션에 모든 정보 저장 (BigInt -> string 변환 포함)
    const serializedUser: UserForSerialization = {
      ...user,
      id: user.id.toString(),
    };

    done(null, serializedUser);
  }

  async deserializeUser(
    payload: UserForSerialization,
    done: (err: Error | null, user?: AuthenticatedUser | false) => void,
    req?: any, // express Request 객체
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

    // 2. 계정 상태 실시간 체크 (활성 상태가 아니면 즉시 차단)
    if (payload.status !== UserStatus.ACTIVE) {
      return done(null, false);
    }

    // 3. 세션 정보 복원 (데이터 오염 방지를 위해 기본값 없이 전달받은 그대로 복원)
    try {
      const authUser: AuthenticatedUser = {
        ...payload,
        id: BigInt(payload.id),
      };
      done(null, authUser);
    } catch (error) {
      // BigInt 변환 실패 등 예기치 못한 페이로드 오류 시 세션 무효화
      done(null, false);
    }
  }
}
