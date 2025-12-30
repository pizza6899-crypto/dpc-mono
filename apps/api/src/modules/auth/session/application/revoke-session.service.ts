import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  USER_SESSION_REPOSITORY,
  type UserSessionRepositoryPort,
} from '../ports/out';
import { UserSession } from '../domain';
import { SessionTrackerService } from '../infrastructure/session-tracker.service';
import { SessionNotFoundException } from '../domain/exception';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';

export interface RevokeSessionParams {
  sessionId: string;
  /**
   * 세션을 종료한 사용자 ID (관리자 ID)
   * revokedBy 필드에 기록됨
   */
  revokedBy: bigint;
  /**
   * 요청자 정보 (옵셔널, audit 로그용)
   */
  requestInfo?: RequestClientInfo;
}

/**
 * 세션 종료 처리 Use Case (관리자용)
 *
 * 관리자가 특정 세션을 명시적으로 종료 처리합니다.
 * - DB에서 세션 상태를 REVOKED로 변경 (revokedBy 기록)
 * - Redis 세션 스토어에서 세션 삭제 (HTTP 세션인 경우)
 * - WebSocket 연결 해제 (WebSocket 세션인 경우)
 */
@Injectable()
export class RevokeSessionService {
  private readonly logger = new Logger(RevokeSessionService.name);

  constructor(
    @Inject(USER_SESSION_REPOSITORY)
    private readonly repository: UserSessionRepositoryPort,
    private readonly sessionTracker: SessionTrackerService,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  @Transactional()
  async execute(params: RevokeSessionParams): Promise<UserSession> {
    const { sessionId, revokedBy, requestInfo } = params;

    // 1. 입력 검증
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      throw new SessionNotFoundException(sessionId);
    }

    if (!revokedBy || revokedBy <= 0) {
      this.logger.warn(`유효하지 않은 revokedBy: ${revokedBy}`);
      throw new Error('Invalid revokedBy');
    }

    // 2. 세션 조회
    const session = await this.repository.findBySessionId(sessionId);

    if (!session) {
      throw new SessionNotFoundException(sessionId);
    }

    // 3. 이미 종료된 세션은 처리하지 않음
    if (session.isTerminated()) {
      this.logger.debug(
        `이미 종료된 세션: sessionId=${sessionId}, status=${session.status}`,
      );
      return session;
    }

    // 4. DB에서 세션 종료 처리 (트랜잭션 내)
    // 관리자가 명시적으로 종료하므로 revoke() 사용 (REVOKED 상태)
    const revokedSession = session.revoke(revokedBy);
    await this.repository.update(revokedSession);

    this.logger.log(
      `세션 종료 처리 시작: sessionId=${sessionId}, userId=${session.userId}, type=${session.type}, revokedBy=${revokedBy}`,
    );

    // 5. 실제 세션 연결 종료 (트랜잭션 외부)
    // DB 업데이트는 이미 완료되었으므로 연결 종료 실패해도 세션 종료는 성공 처리
    // 세션의 isAdmin 필드 사용 (HTTP 세션인 경우 Redis 키 prefix 결정)
    await this.terminateSessionConnection(revokedSession, revokedSession.isAdmin);

    this.logger.log(
      `세션 종료 처리 완료: sessionId=${sessionId}, userId=${session.userId}, type=${session.type}, revokedBy=${revokedBy}`,
    );

    // 6. Audit 로그 기록 (보안 로그)
    try {
      await this.dispatchLogService.dispatch(
        {
          type: LogType.AUTH,
          data: {
            userId: revokedBy.toString(),
            sessionId: sessionId,
            action: 'ADMIN_SESSION_REVOKE',
            status: 'SUCCESS',
            ip: requestInfo?.ip,
            userAgent: requestInfo?.userAgent,
            metadata: {
              targetUserId: session.userId.toString(),
              targetSessionId: sessionId,
              sessionType: session.type,
              isAdmin: session.isAdmin,
            },
          },
        },
        requestInfo,
      );
    } catch (error) {
      // Audit 로그 실패는 세션 종료 성공에 영향을 주지 않도록 처리
      this.logger.error(
        error,
        `Audit log 기록 실패 (세션 종료는 성공) - sessionId: ${sessionId}, revokedBy: ${revokedBy}`,
      );
    }

    return revokedSession;
  }

  /**
   * 실제 세션 연결 종료
   * 
   * 트랜잭션 외부에서 실행되며, 실패해도 DB 업데이트는 유지됩니다.
   * 
   * @private
   */
  private async terminateSessionConnection(
    session: UserSession,
    isAdmin: boolean,
  ): Promise<void> {
    try {
      await this.sessionTracker.terminateSession(
        session.sessionId,
        session.type,
        isAdmin,
      );
    } catch (error) {
      // 세션 연결 종료 실패는 로깅만 하고 계속 진행
      // DB 업데이트는 이미 완료되었으므로 세션 종료는 성공 처리
      this.logger.error(
        error,
        `세션 연결 종료 실패 (DB 업데이트는 완료): sessionId=${session.sessionId}, type=${session.type}, userId=${session.userId}`,
      );
      // 에러를 다시 던지지 않음 - 세션 종료는 성공 처리
    }
  }
}

