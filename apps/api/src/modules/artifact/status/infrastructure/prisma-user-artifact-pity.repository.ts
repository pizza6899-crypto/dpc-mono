import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { ArtifactGrade } from '@prisma/client';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserArtifactPity } from '../domain/user-artifact-pity.entity';
import { UserArtifactPityRepositoryPort } from '../ports/user-artifact-pity.repository.port';
import { UserArtifactPityMapper } from './user-artifact-pity.mapper';

@Injectable()
export class PrismaUserArtifactPityRepository implements UserArtifactPityRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: UserArtifactPityMapper,
  ) { }

  async create(pity: UserArtifactPity): Promise<UserArtifactPity> {
    const data = this.mapper.toPersistence(pity);
    const created = await this.tx.userArtifactPity.create({
      data,
    });
    return this.mapper.toEntity(created);
  }

  async findByUserIdAndGrade(userId: bigint, grade: ArtifactGrade): Promise<UserArtifactPity | null> {
    const record = await this.tx.userArtifactPity.findUnique({
      where: {
        userId_grade: { userId, grade }
      },
    });
    return record ? this.mapper.toEntity(record) : null;
  }

  async update(pity: UserArtifactPity): Promise<UserArtifactPity> {
    const data = this.mapper.toPersistence(pity);
    const updated = await this.tx.userArtifactPity.update({
      where: {
        userId_grade: { userId: pity.userId, grade: pity.grade }
      },
      data,
    });
    return this.mapper.toEntity(updated);
  }

  async upsert(pity: UserArtifactPity): Promise<UserArtifactPity> {
    const data = this.mapper.toPersistence(pity);
    const updated = await this.tx.userArtifactPity.upsert({
      where: {
        userId_grade: { userId: pity.userId, grade: pity.grade }
      },
      create: data,
      update: data,
    });
    return this.mapper.toEntity(updated);
  }
}
