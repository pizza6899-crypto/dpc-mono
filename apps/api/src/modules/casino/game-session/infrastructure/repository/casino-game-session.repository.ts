import { Injectable } from '@nestjs/common';
import { GameAggregatorType } from '@prisma/client';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CasinoGameSessionRepositoryPort } from '../../ports/casino-game-session.repository.port';
import { CasinoGameSession } from '../../domain';
import { CasinoGameSessionMapper } from '../mapper/casino-game-session.mapper';

@Injectable()
export class CasinoGameSessionRepository implements CasinoGameSessionRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: CasinoGameSessionMapper,
  ) {}

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

  async findByid(id: bigint): Promise<CasinoGameSession | null> {
    const found = await this.tx.casinoGameSession.findUnique({
      where: { id },
    });
    return found ? this.mapper.toDomain(found) : null;
  }

  async findRecentByUserId(
    userId: bigint,
    aggregatorType: string,
  ): Promise<CasinoGameSession | null> {
    const found = await this.tx.casinoGameSession.findFirst({
      where: { userId, aggregatorType: aggregatorType as any },
      orderBy: { createdAt: 'desc' },
    });
    return found ? this.mapper.toDomain(found) : null;
  }

  async findRecentByPlayerName(
    playerName: string,
    aggregatorType: string,
  ): Promise<CasinoGameSession | null> {
    const found = await this.tx.casinoGameSession.findFirst({
      where: { playerName, aggregatorType: aggregatorType as any },
      orderBy: { createdAt: 'desc' },
    });
    return found ? this.mapper.toDomain(found) : null;
  }
}
