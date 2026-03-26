import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from '../../../../infrastructure/prisma/prisma.module';
import { CacheService } from '../../../../common/cache/cache.service';
import { CACHE_CONFIG } from '../../../../common/cache/cache.constants';
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
    private readonly cacheService: CacheService,
  ) { }

  async findAll(): Promise<ArtifactCatalog[]> {
    const rawList = await this.cacheService.getOrSet(
      CACHE_CONFIG.ARTIFACT.CATALOG_LIST,
      async () => {
        const records = await this.tx.artifactCatalog.findMany({
          orderBy: { grade: 'asc' },
        });

        // JSON 직렬화를 통해 BigInt 등을 안전하게 변환 (캐시 보관용)
        // 단, BigInt가 포함된 경우 JSON.stringify에서 에러가 날 수 있으므로
        // 프로젝트 전역의 JSON 헬퍼나 단순 객체 복사를 고려해야 함
        // 현재는 catalog records가 BigInt를 포함하고 있으므로 주의 필요
        return records.map(r => JSON.parse(JSON.stringify(r, (_, v) => typeof v === 'bigint' ? v.toString() : v)));
      },
    );

    return rawList.map((m) => this.mapper.toEntity({
      ...m,
      id: BigInt(m.id), // 다시 BigInt로 복구
    }));
  }

  async findByCode(code: string): Promise<ArtifactCatalog | null> {
    const all = await this.findAll();
    return all.find((a) => a.code === code) || null;
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
      minWeight,
      maxWeight,
      benefitTypes,
      minBenefitValue,
      startDate,
      endDate 
    } = options;

    const skip = (page - 1) * limit;

    // 동적 검색 조건 구성
    const where: Prisma.ArtifactCatalogWhereInput = {
      ...(code && { code: { contains: code, mode: 'insensitive' as Prisma.QueryMode } }),
      ...(grades && grades.length > 0 && { grade: { in: grades } }),
      ...( (minWeight !== undefined || maxWeight !== undefined) && {
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

    // 혜택 상세 필터링 (OR 조건)
    if (benefitTypes && benefitTypes.length > 0 && minBenefitValue !== undefined) {
      where.OR = benefitTypes.map(type => ({
        [type]: { gte: minBenefitValue }
      }));
    }

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
      imageUrl: artifact.imageUrl,
      casinoBenefit: stats.casinoBenefit,
      slotBenefit: stats.slotBenefit,
      sportsBenefit: stats.sportsBenefit,
      minigameBenefit: stats.minigameBenefit,
      badBeatBenefit: stats.badBeatBenefit,
      criticalBenefit: stats.criticalBenefit,
      updatedAt: new Date(),
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

    // 데이터가 변경되었으므로 캐시 무효화
    await this.cacheService.del(CACHE_CONFIG.ARTIFACT.CATALOG_LIST);

    return this.mapper.toEntity(record);
  }
}
