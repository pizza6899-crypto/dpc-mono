import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CASINO_GAME_SESSION_REPOSITORY } from '../ports/casino-game-session.repository.token';
import type { CasinoGameSessionRepositoryPort } from '../ports/casino-game-session.repository.port';
import { CasinoGameSession } from '../domain';

@Injectable()
export class FindCasinoGameSessionService {
    constructor(
        @Inject(CASINO_GAME_SESSION_REPOSITORY)
        private readonly repository: CasinoGameSessionRepositoryPort,
    ) { }

    async findByToken(token: string): Promise<CasinoGameSession | null> {
        return await this.repository.findByToken(token);
    }

    async getByToken(token: string): Promise<CasinoGameSession> {
        const session = await this.repository.findByToken(token);
        if (!session) {
            throw new NotFoundException(`Casino Game Session not found for token: ${token}`);
        }
        return session;
    }

    async findByUid(uid: string): Promise<CasinoGameSession | null> {
        return await this.repository.findByUid(uid);
    }

    async findByid(id: bigint): Promise<CasinoGameSession | null> {
        return await this.repository.findByid(id);
    }
}
