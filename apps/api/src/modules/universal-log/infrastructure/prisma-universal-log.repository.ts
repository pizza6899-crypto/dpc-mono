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
