import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from '../../../../infrastructure/prisma/prisma.module';
import { ArtifactCatalogRepositoryPort, ArtifactCatalogSearchOptions } from '../ports/artifact-catalog.repository.port';
import { ArtifactCatalog } from '../domain/artifact-catalog.entity';
import { ArtifactCatalogMapper } from './artifact-catalog.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaArtifactCatalogRepository implements ArtifactCatalogRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: ArtifactCatalogMapper,
  ) { }

  async findAll(): Promise<ArtifactCatalog[]> {
    const records = await this.tx.artifactCatalog.findMany({
      orderBy: { grade: 'asc' },
    });
    return records.map((r) => this.mapper.toEntity(r));
  }

  async findByCode(code: string): Promise<ArtifactCatalog | null> {
    const item = await this.tx.artifactCatalog.findUnique({
      where: { code: code },
    });
    return item ? this.mapper.toEntity(item) : null;
  }

  async findById(id: bigint): Promise<ArtifactCatalog | null> {
    const item = await this.tx.artifactCatalog.findUnique({
      where: { id: id },
    });
    return item ? this.mapper.toEntity(item) : null;
  }

  async findManyAndCount(
    options: ArtifactCatalogSearchOptions,
  ): Promise<{ items: ArtifactCatalog[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      code,
      grades,
      statuses,
      minWeight,
      maxWeight,
      startDate,
      endDate
    } = options;

    const skip = (page - 1) * limit;

    // 동적 검색 조건 구성
    const where: Prisma.ArtifactCatalogWhereInput = {
      ...(code && { code: { contains: code, mode: 'insensitive' as Prisma.QueryMode } }),
      ...(grades && grades.length > 0 && { grade: { in: grades } }),
      ...(statuses && statuses.length > 0 && { status: { in: statuses } }),
      ...((minWeight !== undefined || maxWeight !== undefined) && {
        drawWeight: {
          ...(minWeight !== undefined && { gte: minWeight }),
          ...(maxWeight !== undefined && { lte: maxWeight }),
        }
      }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        }
      } : {}),
    };

    const [total, records] = await Promise.all([
      this.tx.artifactCatalog.count({ where }),
      this.tx.artifactCatalog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      items: records.map(r => this.mapper.toEntity(r)),
      total,
    };
  }

  async save(artifact: ArtifactCatalog): Promise<ArtifactCatalog> {
    const stats = artifact.statsSummary;
    const data = {
      code: artifact.code,
      grade: artifact.grade,
      drawWeight: artifact.drawWeight,
      status: artifact.status,
      imageUrl: artifact.imageUrl,
      casinoBenefit: stats.casinoBenefit,
      slotBenefit: stats.slotBenefit,
      sportsBenefit: stats.sportsBenefit,
      minigameBenefit: stats.minigameBenefit,
      badBeatBenefit: stats.badBeatBenefit,
      criticalBenefit: stats.criticalBenefit,
      updatedAt: artifact.updatedAt,
    };

    let record;
    if (artifact.id === 0n) {
      // 신규 생성 (ID 지정 안 함 -> DB에서 자동 생성)
      record = await this.tx.artifactCatalog.create({
        data: {
          ...data,
          createdAt: artifact.createdAt,
        },
      });
    } else {
      // 수정
      record = await this.tx.artifactCatalog.update({
        where: { id: artifact.id },
        data,
      });
    }

    return this.mapper.toEntity(record);
  }

  async delete(id: bigint): Promise<void> {
    // 논리 삭제 (Soft Delete) 처리
    const artifact = await this.findById(id);
    if (artifact) {
      artifact.deactivate();
      await this.save(artifact);
    }
  }
}
