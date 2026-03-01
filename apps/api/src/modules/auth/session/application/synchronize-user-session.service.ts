import { Inject, Injectable, Logger } from '@nestjs/common';
import {
    USER_SESSION_REPOSITORY,
    type UserSessionRepositoryPort,
} from '../ports/out';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';

export interface SynchronizeUserSessionParams {
    userId: bigint;
    updateData: Partial<AuthenticatedUser>;
}

/**
 * 모든 활성 유저 세션 동기화 Use Case
 *
 * 사용자의 프로필 정보(이메일, 닉네임 등)가 변경되었을 때,
 * Redis에 저장된 모든 활성 세션 정보를 일관성 있게 업데이트합니다.
 */
@Injectable()
export class SynchronizeUserSessionService {
    private readonly logger = new Logger(SynchronizeUserSessionService.name);

    constructor(
        @Inject(USER_SESSION_REPOSITORY)
        private readonly repository: UserSessionRepositoryPort,
    ) { }

    async execute({ userId, updateData }: SynchronizeUserSessionParams): Promise<void> {
        this.logger.log(`Synchronizing sessions for user: ${userId}`);

        // 1. DB에서 해당 유저의 모든 활성 세션 조회
        const activeSessions = await this.repository.findActiveByUserId(userId);

        // HTTP 세션만 필터링 (Redis 세션은 HTTP 세션임)
        const httpSessions = activeSessions.filter((s) => s.isHttpSession());

        if (httpSessions.length === 0) {
            this.logger.debug(`No active HTTP sessions found for user: ${userId}`);
            return;
        }

        // 2. 각 세션별로 Redis 데이터 업데이트
        const updatePromises = httpSessions.map((session) =>
            this.repository
                .updateRedisSessionData(session.sessionId, session.isAdmin, updateData)
                .catch((err) => {
                    this.logger.error(
                        `Failed to sync Redis session ${session.sessionId}: ${err.message}`,
                    );
                }),
        );

        await Promise.all(updatePromises);

        this.logger.log(
            `Successfully synchronized ${httpSessions.length} sessions for user: ${userId}`,
        );
    }
}
