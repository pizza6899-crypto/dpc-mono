import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UserCharacterLogRepositoryPort } from '../ports/user-character-log.repository.port';
import { UserCharacterLog } from '../domain/user-character-log.entity';
import { UserCharacterLogMapper } from './user-character-log.mapper';

@Injectable()
export class UserCharacterLogRepository implements UserCharacterLogRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserCharacterLogMapper,
  ) {}

  async save(log: UserCharacterLog): Promise<void> {
    const persistenceData = this.mapper.toPersistence(log);

    await this.prisma.userCharacterLog.create({
      data: persistenceData,
    });
  }

  async findByUserId(userId: bigint, limit: number = 20, offset: number = 0): Promise<UserCharacterLog[]> {
    const records = await this.prisma.userCharacterLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return records.map((record) => this.mapper.toDomain(record));
  }
}
