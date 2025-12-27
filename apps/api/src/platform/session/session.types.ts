// src/platform/session/session.types.ts
import type { UserSession } from '@prisma/client';
import type { RequestClientInfo } from '../http/types/client-info.types';

export interface CreateSessionDto {
  userId: string;
  sessionId: string;
  requestInfo: RequestClientInfo;
  expiresAt: Date;
}

export interface SessionInfo {
  id: string;
  sessionId: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  isMobile: boolean | null;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
}

export type UserSessionWithInfo = UserSession & {
  user?: {
    id: string;
    email: string | null;
  };
};
