import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserAgentCatalogRepositoryPort } from '../ports/user-agent-catalog.repository.port';
import { UserAgentCatalog } from '../domain/user-agent-catalog.entity';
import { UserAgentCatalogMapper } from './user-agent-catalog.mapper';
import { CacheService } from 'src/infrastructure/cache/cache.service';
import { CACHE_CONFIG } from 'src/infrastructure/cache/cache.constants';

@Injectable()
export class PrismaUserAgentCatalogRepository implements UserAgentCatalogRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly cacheService: CacheService,
  ) { }

  /**
   * UserAgent 정보를 원자적으로 조회 또는 생성 (Redis 캐시 병행 + Sliding Expiry)
   */
  async upsert(catalog: UserAgentCatalog): Promise<bigint> {
    const config = CACHE_CONFIG.UNIVERSAL_LOG.USER_AGENT(catalog.uaHash);

    // 1. 캐시 조회 (Hit 시 원자적으로 수명 연장 - GETEX)
    const cachedId = await this.cacheService.getAndTouch<bigint>(config);
    if (cachedId) return cachedId;

    // 2. 캐시 부재 시 DB 로직 실행
    // (동시성 이슈를 고려하여 getOrSet 형태의 로직을 직접 구현)
    // 2.1 DB 조회 (SELECT)
    const existing = await this.tx.userAgentCatalog.findUnique({
      where: { uaHash: catalog.uaHash },
      select: { id: true },
    });

    let resultId: bigint;

    if (existing) {
      resultId = existing.id;
    } else {
      // 2.2 존재하지 않을 때만 생성 (Race Condition 대비 try-catch)
      try {
        const created = await this.tx.userAgentCatalog.create({
          data: {
            uaString: catalog.uaString,
            uaHash: catalog.uaHash,
            browser: catalog.browser,
            os: catalog.os,
            device: catalog.device,
          },
          select: { id: true },
        });
        resultId = created.id;
      } catch (e) {
        // 거의 동시에 다른 요청이 생성한 경우, 다시 조회해서 반환
        const secondTry = await this.tx.userAgentCatalog.findUnique({
          where: { uaHash: catalog.uaHash },
          select: { id: true },
        });
        if (secondTry) {
          resultId = secondTry.id;
        } else {
          throw e;
        }
      }
    }

    // 3. 새로 조회/생성된 ID를 캐시에 저장
    await this.cacheService.set(config, resultId);
    return resultId;
  }

  /**
   * ID로 상세 정보 조회
   */
  async findById(id: bigint): Promise<UserAgentCatalog | null> {
    const agent = await this.tx.userAgentCatalog.findUnique({
      where: { id },
    });

    if (!agent) return null;

    return UserAgentCatalogMapper.toDomain(agent);
  }
}
