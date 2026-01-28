import { Injectable } from '@nestjs/common';
import { TierSettingsRepositoryPort } from '../infrastructure/master.repository.port';
import { TierSettings } from '../domain/tier-settings.entity';
import { TierSettingsNotFoundException } from '../domain/tier-master.exception';

@Injectable()
export class TierSettingsService {
    // 인메모리 캐시 변수
    private cachedSettings: TierSettings | null = null;
    private lastFetched: number = 0;
    private readonly CACHE_TTL = 60 * 1000; // 1분 (60,000ms)

    constructor(
        private readonly repository: TierSettingsRepositoryPort,
    ) { }

    async find(): Promise<TierSettings> {
        const now = Date.now();

        // 1. 인메모리 캐시 확인 (TTL 체크)
        if (this.cachedSettings && (now - this.lastFetched < this.CACHE_TTL)) {
            return this.cachedSettings;
        }

        const settings = await this.repository.find();
        if (!settings) {
            throw new TierSettingsNotFoundException();
        }

        // 2. 캐시 갱신
        this.cachedSettings = settings;
        this.lastFetched = now;

        return settings;
    }

    async update(props: {
        isPromotionEnabled?: boolean;
        isDowngradeEnabled?: boolean;
        updatedBy: bigint;
    }): Promise<TierSettings> {
        const existing = await this.find();

        const updated = await this.repository.update({
            ...props,
            evaluationHourUtc: existing.evaluationHourUtc,
        });

        // 3. 로컬 캐시 즉시 갱신 (수정 직후 조회 시 최신값 보장)
        this.cachedSettings = updated;
        this.lastFetched = Date.now();

        return updated;
    }
}
