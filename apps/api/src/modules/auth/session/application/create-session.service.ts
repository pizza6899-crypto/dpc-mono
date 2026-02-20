import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { generateUid } from 'src/utils/id.util';
import { UserSession, SessionType, DeviceInfo } from '../domain';
import { SessionPolicy } from '../domain/policy';
import {
  USER_SESSION_REPOSITORY,
  type UserSessionRepositoryPort,
} from '../ports/out';
import { SessionTrackerService } from '../infrastructure/session-tracker.service';

export interface CreateSessionParams {
  userId: bigint;
  sessionId: string;
  type: SessionType;
  isAdmin?: boolean;
  deviceInfo: DeviceInfo;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * 세션 생성 Use Case
 *
 * 로그인 시 HTTP 세션과 WebSocket 세션을 생성합니다.
 * - 정책에 따라 기존 세션 종료 처리
 * - 디바이스 타입별 제한 확인
 * - 세션 엔티티 생성 및 저장
 */
@Injectable()
export class CreateSessionService {
  private readonly logger = new Logger(CreateSessionService.name);

  constructor(
    @Inject(USER_SESSION_REPOSITORY)
    private readonly repository: UserSessionRepositoryPort,
    private readonly policy: SessionPolicy,
    private readonly sessionTracker: SessionTrackerService,
  ) {}

  @Transactional()
  async execute(params: CreateSessionParams): Promise<UserSession> {
    const {
      userId,
      sessionId,
      type,
      isAdmin = false,
      deviceInfo,
      expiresAt,
      metadata,
    } = params;

    // 1. 기존 활성 세션 조회 (같은 디바이스 타입)
    const existingActiveSessions =
      await this.repository.findActiveByUserId(userId);

    // 2. 정책 확인 및 기존 세션 종료
    const sessionsToRevoke = this.policy.getSessionsToRevokeForNewLogin(
      existingActiveSessions,
      deviceInfo.isMobile ?? false,
    );

    // 3. 기존 세션 종료
    for (const session of sessionsToRevoke) {
      // 로그인 시 자동으로 종료되는 경우이므로 revokedBy는 null
      const revokedSession = session.revoke(null);
      await this.repository.update(revokedSession);

      // 실제 세션 연결도 종료
      // 기존 세션의 isAdmin 필드 사용 (HTTP 세션인 경우만 의미 있음)
      await this.sessionTracker.terminateSession(
        session.sessionId,
        session.type,
        session.isAdmin,
      );

      this.logger.log(
        `기존 세션 종료: sessionId=${session.sessionId}, userId=${userId}, type=${session.type}, isAdmin=${session.isAdmin}`,
      );
    }

    // 4. 새 세션 생성
    const uid = generateUid();

    const newSession = UserSession.create({
      uid,
      userId,
      sessionId,
      type,
      isAdmin,
      deviceInfo,
      expiresAt,
      metadata,
    });

    const savedSession = await this.repository.create(newSession);

    this.logger.log(
      `세션 생성 완료: sessionId=${sessionId}, userId=${userId}, type=${type}, isMobile=${deviceInfo.isMobile}`,
    );

    return savedSession;
  }
}
