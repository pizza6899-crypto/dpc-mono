import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CasinoGameSessionRepositoryPort } from '../../ports/out/casino-game-session.repository.port';
import { CasinoGameSession } from '../../domain/model/casino-game-session.entity';
import { CasinoGameSessionMapper } from '../mapper/casino-game-session.mapper';

@Injectable()
export class CasinoGameSessionRepository
    implements CasinoGameSessionRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: CasinoGameSessionMapper,
    ) { }

    async create(session: CasinoGameSession): Promise<CasinoGameSession> {
        const data = this.mapper.toPersistence(session);
        const created = await this.tx.casinoGameSession.create({ data });
        return this.mapper.toDomain(created);
    }

    async findByToken(token: string): Promise<CasinoGameSession | null> {
        const found = await this.tx.casinoGameSession.findUnique({
            where: { token },
        });
        return found ? this.mapper.toDomain(found) : null;
    }

    async findByUid(uid: string): Promise<CasinoGameSession | null> {
        const found = await this.tx.casinoGameSession.findUnique({
            where: { uid },
        });
        return found ? this.mapper.toDomain(found) : null;
    }

    async findByid(id: bigint): Promise<CasinoGameSession | null> {
        const found = await this.tx.casinoGameSession.findUnique({
            where: { id },
        });
        return found ? this.mapper.toDomain(found) : null;
    }
}
