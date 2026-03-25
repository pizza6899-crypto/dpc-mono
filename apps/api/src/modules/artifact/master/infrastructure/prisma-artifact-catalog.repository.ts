import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from '../../../../infrastructure/prisma/prisma.module';
import { CacheService } from '../../../../common/cache/cache.service';
import { CACHE_CONFIG } from '../../../../common/cache/cache.constants';
import { ArtifactCatalogRepositoryPort } from '../ports/artifact-catalog.repository.port';
import { ArtifactCatalog } from '../domain/artifact-catalog.entity';
import { ArtifactCatalogMapper } from './artifact-catalog.mapper';

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
    const all = await this.findAll();
    return all.find((a) => a.id === id) || null;
  }
}
