import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UniversalLogRepositoryPort } from '../ports/universal-log.repository.port';
import { UniversalLog } from '../domain/universal-log.entity';
import { LogActionKey } from '../domain/types';
import { UniversalLogMapper } from './universal-log.mapper';

@Injectable()
export class PrismaUniversalLogRepository implements UniversalLogRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async save<K extends LogActionKey>(log: UniversalLog<K>): Promise<void> {
    const data = UniversalLogMapper.toPersistence(log);

    await this.tx.universalLog.create({
      data: {
        ...data,
      } as any,
    });
  }

  async saveMany(logs: UniversalLog[]): Promise<void> {
    const data = logs.map(log => UniversalLogMapper.toPersistence(log));

    // Prisma createMany (PostgreSQL) 는 매우 빠르며 원자적임
    await this.tx.universalLog.createMany({
      data: data as any[],
      skipDuplicates: true, // 만에 하나 중복 인입될 경우 대비
    });
  }

  async findById<K extends LogActionKey = LogActionKey>(id: bigint, createdAt: Date): Promise<UniversalLog<K> | null> {
    const log = await this.tx.universalLog.findUnique({
      where: {
        id_createdAt: { id, createdAt },
      },
    });

    if (!log) return null;

    return UniversalLogMapper.toDomain<K>(log as any);
  }
}
