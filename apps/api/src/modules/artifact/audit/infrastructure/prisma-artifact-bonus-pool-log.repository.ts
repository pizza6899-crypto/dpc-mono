import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { Prisma } from '@prisma/client';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ArtifactBonusPoolLog } from '../domain/artifact-bonus-pool-log.entity';
import { ArtifactBonusPoolLogRepositoryPort, ArtifactBonusPoolLogFindOptions } from '../ports/artifact-bonus-pool-log.repository.port';

import { ArtifactBonusPoolLogMapper } from './artifact-bonus-pool-log.mapper';

@Injectable()
export class PrismaArtifactBonusPoolLogRepository implements ArtifactBonusPoolLogRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: ArtifactBonusPoolLogMapper,
  ) { }

  async create(log: ArtifactBonusPoolLog): Promise<ArtifactBonusPoolLog> {
    const data = this.mapper.toPersistence(log);
    const created = await this.tx.artifactBonusPoolLog.create({
      data,
    });

    return this.mapper.toEntity(created);
  }

  async findAndCount(options: ArtifactBonusPoolLogFindOptions): Promise<[ArtifactBonusPoolLog[], number]> {
    const { userId, types, startDate, endDate, skip, take, orderBy } = options;

    const where: Prisma.ArtifactBonusPoolLogWhereInput = {
      userId,
      type: types ? { in: types } : undefined,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [logs, count] = await Promise.all([
      this.tx.artifactBonusPoolLog.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.tx.artifactBonusPoolLog.count({ where }),
    ]);

    return [logs.map((log) => this.mapper.toEntity(log)), count];
  }
}
