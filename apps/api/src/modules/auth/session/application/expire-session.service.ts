import { Inject, Injectable, Logger } from '@nestjs/common';
import {
    USER_SESSION_REPOSITORY,
    type UserSessionRepositoryPort,
} from '../ports/out';
import { SessionType } from '../domain';

export interface ExpireSessionParams {
    sessionId: string;
    userId?: bigint;
    type?: SessionType;
}

/**
 * 특정 세션의 자연스러운 만료 처리 Use Case
 *
 * 웹소켓 연결 해제 등 세션이 정상적으로 종료되어야 할 때 사용합니다.
 * 관리자에 의한 강제 종료(REVOKE)와 달리 별도의 감사 로그를 남기지 않고,
 * 단순히 상태를 EXPIRED로 변경합니다.
 */
@Injectable()
export class ExpireSessionService {
    private readonly logger = new Logger(ExpireSessionService.name);

    constructor(
        @Inject(USER_SESSION_REPOSITORY)
        private readonly repository: UserSessionRepositoryPort,
    ) { }

    async execute(params: ExpireSessionParams): Promise<void> {
        const { sessionId, userId, type } = params;

        if (!sessionId) {
            return;
        }

        try {
            // 1. 세션 조회
            const session = await this.repository.findBySessionId(sessionId);

            // 존재하지 않거나 이미 종료된 경우 무시
            if (!session || session.isTerminated()) {
                this.logger.debug(`Session not found or already terminated: ${sessionId}`);
                return;
            }

            // 2. 검증: 요청된 정보와 실제 데이터가 일치하는지 확인
            if (userId && session.userId !== userId) {
                this.logger.warn(`Session user mismatch: expected ${userId}, found ${session.userId}`);
                return;
            }

            if (type && session.type !== type) {
                this.logger.debug(`Session type mismatch for ${sessionId}: expected ${type}, found ${session.type}. Skipping expire.`);
                return;
            }

            // 3. 세션 상태를 EXPIRED로 변경하여 저장
            await this.repository.update(session.expire());

            this.logger.log(`Session expired successfully: ${sessionId} (Type: ${session.type}, User: ${session.userId})`);
        } catch (error) {
            // 자연 종료 과정에서의 에러는 로깅 후 무시 (상위 레이어 전파 방지)
            this.logger.warn(`Failed to expire session ${sessionId}: ${error.message}`);
        }
    }
}
