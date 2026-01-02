import { Injectable, Logger } from '@nestjs/common';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { RevokeSessionService } from '../../session/application/revoke-session.service';

export interface LogoutParams {
  userId?: bigint;
  sessionId?: string; // Express session ID
  clientInfo: RequestClientInfo;
  isAdmin?: boolean;
}

/**
 * 로그아웃 처리 Use Case
 */
@Injectable()
export class LogoutService {
  private readonly logger = new Logger(LogoutService.name);

  constructor(
    private readonly revokeSessionService: RevokeSessionService,
  ) {}

  async execute({
    userId,
    sessionId,
    clientInfo,
    isAdmin = false,
  }: LogoutParams): Promise<void> {
    // HTTP 세션 종료 (sessionId가 있는 경우)
    if (sessionId && userId) {
      try {
        await this.revokeSessionService.execute({
          sessionId,
          revokedBy: userId, // 본인이 로그아웃한 경우
        });
      } catch (error) {
        // 세션 종료 실패는 로그아웃 성공에 영향을 주지 않도록 처리
        this.logger.error(
          error,
          `세션 종료 실패 (로그아웃은 성공) - sessionId: ${sessionId}, userId: ${userId}`,
        );
      }
    }
  }
}
