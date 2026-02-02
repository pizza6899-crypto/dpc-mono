import { Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { WageringConfigRepositoryPort } from '../ports/wagering-config.repository.port';
import { WageringConfig } from '../domain/wagering-config.entity';
import { WageringConfigMapper } from './wagering-config.mapper';
import { CacheService } from 'src/common/cache/cache.service';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';
import type { WageringConfig as PrismaWageringConfig } from '@prisma/client';
import { WageringConfigNotFoundException } from '../domain/wagering-config.exception';

@Injectable()
export class WageringConfigRepository implements WageringConfigRepositoryPort {
    private readonly logger = new Logger(WageringConfigRepository.name);
    private readonly CONFIG_ID = 1n;

    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: WageringConfigMapper,
        private readonly cacheService: CacheService,
    ) { }

    async getConfig(): Promise<WageringConfig> {
        // 캐시에는 '순수 데이터(Plain Object)'만 저장하여 직렬화 문제를 방지합니다.
        const raw = await this.cacheService.getOrSet(
            CACHE_CONFIG.WAGERING.CONFIG,
            async () => {
                this.logger.debug(`Fetching WageringConfig from DB (Cache Miss)`);
                const config = await this.tx.wageringConfig.findUnique({
                    where: { id: this.CONFIG_ID }
                });

                if (!config) {
                    throw new WageringConfigNotFoundException();
                }

                // BigInt 포함 객체를 캐싱하기 위해 안전하게 변환 (JSON serialization issue 방지)
                return JSON.parse(JSON.stringify(config, (_, v) => typeof v === 'bigint' ? v.toString() : v));
            }
        );

        // 캐시에서 꺼낸 데이터를 Mapper를 통해 항상 최신 도메인 엔티티 인스턴스로 변환합니다.
        return this.mapper.toDomain(raw);
    }

    async save(config: WageringConfig): Promise<WageringConfig> {
        const data = this.mapper.toPrisma(config);
        const result = await this.tx.wageringConfig.update({
            where: { id: config.id },
            data,
        });

        // 저장 시 캐시 무효화 (BigInt 직렬화 문제를 피하기 위해 단순히 삭제 후 다음 조회 시 갱신)
        await this.cacheService.del(CACHE_CONFIG.WAGERING.CONFIG);

        return this.mapper.toDomain(result);
    }
}
