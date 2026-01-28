import { Injectable } from '@nestjs/common';
import { TierRepositoryPort, UpdateTierProps } from '../infrastructure/master.repository.port';
import { Tier } from '../domain/tier.entity';
import { DomainException } from 'src/common/exception/domain.exception';
import { MessageCode } from '@repo/shared';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class TierService {
    private cachedTiers: Tier[] | null = null;
    private lastFetched: number = 0;
    private readonly CACHE_TTL = 60 * 1000; // 1분

    constructor(
        private readonly repository: TierRepositoryPort,
    ) { }

    async findAll(): Promise<Tier[]> {
        const now = Date.now();
        if (this.cachedTiers && (now - this.lastFetched < this.CACHE_TTL)) {
            return this.cachedTiers;
        }

        const tiers = await this.repository.findAll();
        this.cachedTiers = tiers;
        this.lastFetched = now;
        return tiers;
    }

    async findById(id: bigint): Promise<Tier> {
        const tiers = await this.findAll();
        const tier = tiers.find(t => t.id === id);

        if (!tier) {
            throw new DomainException('Tier not found', MessageCode.TIER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        return tier;
    }

    async update(props: UpdateTierProps): Promise<Tier> {
        const updated = await this.repository.update(props);

        // 캐시 즉시 갱신 (리스트 전체 다시 불러오기 혹은 일부 수정)
        // 여기서는 간단하게 캐시를 비워서 다음 조회 시 최신화되도록 함
        this.cachedTiers = null;
        this.lastFetched = 0;

        return updated;
    }
}
