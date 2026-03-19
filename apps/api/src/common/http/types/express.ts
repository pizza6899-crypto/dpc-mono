import type { RequestClientInfo } from './client-info.types';
import type { AuthenticatedUser } from '../../auth/types/auth.types';
import type { Session, SessionData } from 'express-session';

/**
 * Express Request 타입 확장
 * RequestInfoInterceptor에서 추출한 클라이언트 정보를 저장합니다.
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * 클라이언트 정보
       * RequestInfoInterceptor에서 한 번만 추출되어 저장됩니다.
       */
      clientInfo?: RequestClientInfo;

      /**
       * Passport를 통해 인증된 사용자 정보
       */
      user?: AuthenticatedUser;

      /**
       * Express Session 객체
       */
      session: Session & Partial<SessionData>;

      /**
       * Express Session ID
       */
      sessionID: string;
    }
  }
}

export {};
