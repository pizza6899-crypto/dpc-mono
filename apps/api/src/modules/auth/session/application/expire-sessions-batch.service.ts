import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  USER_SESSION_REPOSITORY,
  type UserSessionRepositoryPort,
} from '../ports/out';
import { SessionTrackerService } from '../infrastructure/session-tracker.service';
import { SessionStatus } from '../domain';

export interface ExpireSessionsBatchParams {
  /**
   * 한 번에 처리할 최대 세션 수
   * 기본값: 100
   */
  batchSize?: number;
}

/**
 * 만료된 세션 일괄 처리 Use Case
 *
 * 만료 시간이 지난 활성 세션들을 일괄적으로 만료 처리합니다.
 * - DB에서 세션 상태를 EXPIRED로 변경
 * - Redis 세션 스토어에서 세션 삭제 (HTTP 세션인 경우)
 * - WebSocket 연결 해제 (WebSocket 세션인 경우)
 * - 스케줄러에서 주기적으로 호출
 * - 배치 단위로 처리하여 성능 최적화
 */
@Injectable()
export class ExpireSessionsBatchService {
  private readonly logger = new Logger(ExpireSessionsBatchService.name);

  constructor(
    @Inject(USER_SESSION_REPOSITORY)
    private readonly repository: UserSessionRepositoryPort,
    private readonly sessionTracker: SessionTrackerService,
  ) {}

  @Transactional()
  async execute(
    params: ExpireSessionsBatchParams = {},
  ): Promise<{ expiredCount: number }> {
    const batchSize = params.batchSize ?? 100;

    // 1. 만료된 세션 조회
    const expiredSessions = await this.repository.findExpiredSessions(batchSize);

    if (expiredSessions.length === 0) {
      return { expiredCount: 0 };
    }

    // 2. 각 세션 만료 처리
    let expiredCount = 0;
    for (const session of expiredSessions) {
      // findExpiredSessions는 만료 시간이 지난 활성 세션을 조회하므로,
      // status가 ACTIVE인지 확인 (isActive()와 isTerminated()는 isExpired()도 확인하므로 사용하지 않음)
      if (session.status === SessionStatus.ACTIVE) {
        // DB 업데이트
        const expiredSession = session.expire();
        await this.repository.update(expiredSession);

        // 실제 세션 연결 종료
        try {
          // 세션 엔티티의 isAdmin 필드 사용
          await this.sessionTracker.terminateSession(
            session.sessionId,
            session.type,
            session.isAdmin,
          );
        } catch (error) {
          // 세션 연결 종료 실패는 로깅만 하고 계속 진행
          this.logger.error(
            error,
            `세션 연결 종료 실패 (DB 업데이트는 완료): sessionId=${session.sessionId}, type=${session.type}`,
          );
        }

        expiredCount++;
      }
    }

    this.logger.log(
      `만료된 세션 처리 완료: ${expiredCount}개 세션 만료 처리됨`,
    );

    return { expiredCount };
  }
}

