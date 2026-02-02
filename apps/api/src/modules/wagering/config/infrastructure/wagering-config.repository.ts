import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { WageringConfigRepositoryPort } from '../ports/wagering-config.repository.port';
import { WageringConfig } from '../domain/wagering-config.entity';
import { WageringConfigMapper } from './wagering-config.mapper';

@Injectable()
export class WageringConfigRepository implements WageringConfigRepositoryPort {
    private readonly CONFIG_ID = 1n;

    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: WageringConfigMapper,
    ) { }

    async getConfig(): Promise<WageringConfig> {
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

    async save(config: WageringConfig): Promise<WageringConfig> {
        const data = this.mapper.toPrisma(config);
        const result = await this.tx.wageringConfig.update({
            where: { id: config.id },
            data: data as any,
        });
        return this.mapper.toDomain(result);
    }
}
