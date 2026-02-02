import { Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { WageringConfigRepositoryPort } from '../ports/wagering-config.repository.port';
import { WageringConfig } from '../domain/wagering-config.entity';
import { WageringConfigMapper } from './wagering-config.mapper';
import { CacheService } from 'src/common/cache/cache.service';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';

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
        // 캐시 모듈을 사용하여 조회 부하 최적화
        return await this.cacheService.getOrSet(
            CACHE_CONFIG.WAGERING.CONFIG,
            async () => {
                this.logger.debug(`Fetching WageringConfig from DB (Cache Miss)`);
                const config = await this.tx.wageringConfig.upsert({
                    where: { id: this.CONFIG_ID },
                    update: {},
                    create: {
                        id: this.CONFIG_ID,
                        defaultBonusExpiryDays: 30,
                        currencySettings: {},
                        isWageringCheckEnabled: true,
                        isAutoCancellationEnabled: true,
                    }
                });
                return this.mapper.toDomain(config);
            }
        );
    }

    async save(config: WageringConfig): Promise<WageringConfig> {
        const data = this.mapper.toPrisma(config);
        const result = await this.tx.wageringConfig.update({
            where: { id: config.id },
            data: data as any,
        });

        const domain = this.mapper.toDomain(result);

        // 저장 시 캐시 업데이트 (무효화 대신 새 값으로 갱신)
        await this.cacheService.set(CACHE_CONFIG.WAGERING.CONFIG, domain);

        return domain;
    }
}
