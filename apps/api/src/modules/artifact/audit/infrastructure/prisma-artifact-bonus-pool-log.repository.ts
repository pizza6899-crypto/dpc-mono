import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ArtifactBonusPoolLog } from '../domain/artifact-bonus-pool-log.entity';
import { ArtifactBonusPoolLogRepositoryPort } from '../ports/artifact-bonus-pool-log.repository.port';

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
}
