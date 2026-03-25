import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from '../../../../infrastructure/prisma/prisma.module';
import { CacheService } from '../../../../common/cache/cache.service';
import { CACHE_CONFIG } from '../../../../common/cache/cache.constants';
import { ArtifactPolicyRepositoryPort } from '../ports/artifact-policy.repository.port';
import { ArtifactPolicy } from '../domain/artifact-policy.entity';
import { ArtifactPolicyMapper } from './artifact-policy.mapper';

@Injectable()
export class PrismaArtifactPolicyRepository implements ArtifactPolicyRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: ArtifactPolicyMapper,
    private readonly cacheService: CacheService,
  ) { }

  async findPolicy(): Promise<ArtifactPolicy | null> {
    const raw = await this.cacheService.getOrSet(
      CACHE_CONFIG.ARTIFACT.POLICY,
      async () => {
        const record = await this.tx.artifactPolicy.findUnique({
          where: { id: ArtifactPolicy.POLICY_ID },
        });

        if (!record) return null;

        return JSON.parse(JSON.stringify(record, (_, v) => typeof v === 'bigint' ? v.toString() : v));
      },
    );

    if (!raw) return null;

    return this.mapper.toEntity({
      ...raw,
      id: BigInt(raw.id),
    });
  }
}
