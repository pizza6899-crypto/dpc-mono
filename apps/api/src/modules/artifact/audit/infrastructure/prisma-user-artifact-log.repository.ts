import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { Prisma } from '@prisma/client';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserArtifactLog } from '../domain/user-artifact-log.entity';
import { UserArtifactLogRepositoryPort, UserArtifactLogFindOptions } from '../ports/user-artifact-log.repository.port';

import { UserArtifactLogMapper } from './user-artifact-log.mapper';

@Injectable()
export class PrismaUserArtifactLogRepository implements UserArtifactLogRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: UserArtifactLogMapper,
  ) { }

  async create(log: UserArtifactLog): Promise<UserArtifactLog> {
    const data = this.mapper.toPersistence(log);
    const created = await this.tx.userArtifactLog.create({
      data,
    });

    return this.mapper.toEntity(created);
  }

  async findAndCount(options: UserArtifactLogFindOptions): Promise<[UserArtifactLog[], number]> {
    const { userId, artifactId, types, grades, startDate, endDate, skip, take, orderBy } = options;

    const where: Prisma.UserArtifactLogWhereInput = {
      userId,
      artifactId,
      type: types ? { in: types } : undefined,
      grade: grades ? { in: grades } : undefined,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [logs, count] = await Promise.all([
      this.tx.userArtifactLog.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.tx.userArtifactLog.count({ where }),
    ]);

    return [logs.map((log) => this.mapper.toEntity(log)), count];
  }
}
