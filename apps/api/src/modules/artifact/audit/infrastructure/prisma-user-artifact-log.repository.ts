import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserArtifactLog } from '../domain/user-artifact-log.entity';
import { UserArtifactLogRepositoryPort } from '../ports/user-artifact-log.repository.port';

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
}
