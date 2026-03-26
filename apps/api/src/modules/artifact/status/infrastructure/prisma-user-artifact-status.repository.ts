import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserArtifactStatus } from '../domain/user-artifact-status.entity';
import { UserArtifactStatusRepositoryPort } from '../ports/user-artifact-status.repository.port';
import { UserArtifactStatusMapper } from './user-artifact-status.mapper';

@Injectable()
export class PrismaUserArtifactStatusRepository implements UserArtifactStatusRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: UserArtifactStatusMapper,
  ) { }

  async create(status: UserArtifactStatus): Promise<UserArtifactStatus> {
    const data = this.mapper.toPersistence(status);
    const created = await this.tx.userArtifactStatus.create({
      data,
    });
    return this.mapper.toEntity(created);
  }

  async findByUserId(userId: bigint): Promise<UserArtifactStatus | null> {
    const record = await this.tx.userArtifactStatus.findUnique({
      where: { userId },
    });
    return record ? this.mapper.toEntity(record) : null;
  }

  async update(status: UserArtifactStatus): Promise<UserArtifactStatus> {
    const data = this.mapper.toPersistence(status);
    const updated = await this.tx.userArtifactStatus.update({
      where: { userId: status.userId },
      data,
    });
    return this.mapper.toEntity(updated);
  }

  async upsert(status: UserArtifactStatus): Promise<UserArtifactStatus> {
    const data = this.mapper.toPersistence(status);
    const updated = await this.tx.userArtifactStatus.upsert({
      where: { userId: status.userId },
      create: data,
      update: data,
    });
    return this.mapper.toEntity(updated);
  }
}
