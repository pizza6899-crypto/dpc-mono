import { Injectable, Inject, Logger } from '@nestjs/common';
import { CASINO_GAME_SESSION_REPOSITORY } from '../ports/casino-game-session.repository.token';
import type { CasinoGameSessionRepositoryPort } from '../ports/casino-game-session.repository.port';

@Injectable()
export class RevokeUserGameSessionsService {
    private readonly logger = new Logger(RevokeUserGameSessionsService.name);

    constructor(
        @Inject(CASINO_GAME_SESSION_REPOSITORY)
        private readonly repository: CasinoGameSessionRepositoryPort,
    ) { }

    /**
     * 유저의 모든 게임 세션 파기
     * @param userId 유저 ID
     * @param revokedBy 파기한 관리자 ID
     * @returns 파기된 세션 수
     */
    async execute(userId: bigint, revokedBy: bigint): Promise<number> {
        this.logger.log(`Revoking all game sessions for user ${userId} by admin ${revokedBy}`);
        const count = await this.repository.revokeByUserId(userId, revokedBy);
        if (count > 0) {
            this.logger.log(`Successfully revoked ${count} game sessions for user ${userId}`);
        }
        return count;
    }
}
