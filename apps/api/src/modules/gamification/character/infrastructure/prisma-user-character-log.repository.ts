import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserCharacterLogRepositoryPort } from '../ports/user-character-log.repository.port';
import { UserCharacterLog } from '../domain/user-character-log.entity';
import { UserCharacterLogMapper } from './user-character-log.mapper';

@Injectable()
export class PrismaUserCharacterLogRepository implements UserCharacterLogRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: UserCharacterLogMapper,
  ) { }

  async save(log: UserCharacterLog): Promise<void> {
    const persistenceData = this.mapper.toPersistence(log);

    await this.tx.userCharacterLog.create({
      data: persistenceData,
    });
  }

  async findByUserId(userId: bigint, limit: number = 20, offset: number = 0): Promise<UserCharacterLog[]> {
    const records = await this.tx.userCharacterLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  async countByUserId(userId: bigint): Promise<number> {
    return this.tx.userCharacterLog.count({
      where: { userId },
    });
  }
}
