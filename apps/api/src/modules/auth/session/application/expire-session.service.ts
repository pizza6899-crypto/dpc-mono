import { Inject, Injectable, Logger } from '@nestjs/common';
import {
    USER_SESSION_REPOSITORY,
    type UserSessionRepositoryPort,
} from '../ports/out';

export interface ExpireSessionParams {
    sessionId: string;
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

    async execute({ sessionId }: ExpireSessionParams): Promise<void> {
        if (!sessionId) {
            return;
        }

        try {
            // 1. 세션 조회
            const session = await this.repository.findBySessionId(sessionId);

            // 이미 종료되었거나 존재하지 않으면 무시
            if (!session || session.isTerminated()) {
                return;
            }

            // 2. 세션 상태를 EXPIRED로 변경하여 저장
            await this.repository.update(session.expire());

            this.logger.debug(`Session expired successfully: ${sessionId}`);
        } catch (error) {
            // 자연 종료 과정에서의 에러는 로깅 후 무시 (상위 레이어 전파 방지)
            this.logger.warn(`Failed to expire session ${sessionId}: ${error.message}`);
        }
    }
}
