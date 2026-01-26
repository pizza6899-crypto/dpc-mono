import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { Prisma } from '@prisma/client';
import { CompConfigRepositoryPort } from '../ports';
import { CompConfig } from '../domain';
import { CompMapper } from './comp.mapper';

@Injectable()
export class CompConfigRepository implements CompConfigRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: CompMapper,
    ) { }

    async getConfig(): Promise<CompConfig | null> {
        const result = await this.tx.compConfig.findFirst();
        return result ? this.mapper.toConfigDomain(result) : null;
    }

    async save(config: CompConfig): Promise<CompConfig> {
        const data = this.mapper.toConfigPersistence(config);

        let result;
        if (data.id) {
            result = await this.tx.compConfig.update({
                where: { id: data.id },
                data: {
                    isEarnEnabled: data.isEarnEnabled,
                    isClaimEnabled: data.isClaimEnabled,
                    allowNegativeBalance: data.allowNegativeBalance,
                    minClaimAmount: data.minClaimAmount,
                    maxDailyEarnPerUser: data.maxDailyEarnPerUser,
                    expirationDays: data.expirationDays,
                    description: data.description,
                }
            });
        } else {
            // Ensure only one config exists or strictly update if ID provided
            // For simplicity, findFirst -> update or create
            const existing = await this.tx.compConfig.findFirst();
            if (existing) {
                result = await this.tx.compConfig.update({
                    where: { id: existing.id },
                    data: {
                        isEarnEnabled: data.isEarnEnabled,
                        isClaimEnabled: data.isClaimEnabled,
                        allowNegativeBalance: data.allowNegativeBalance,
                        minClaimAmount: data.minClaimAmount,
                        maxDailyEarnPerUser: data.maxDailyEarnPerUser,
                        expirationDays: data.expirationDays,
                        description: data.description,
                    }
                });
            } else {
                result = await this.tx.compConfig.create({
                    data: {
                        isEarnEnabled: data.isEarnEnabled ?? true,
                        isClaimEnabled: data.isClaimEnabled ?? true,
                        allowNegativeBalance: data.allowNegativeBalance ?? true,
                        minClaimAmount: data.minClaimAmount ?? new Prisma.Decimal(0.01),
                        maxDailyEarnPerUser: data.maxDailyEarnPerUser ?? new Prisma.Decimal(0),
                        expirationDays: data.expirationDays ?? 365,
                        description: data.description,
                    } as any
                });
            }
        }

        return this.mapper.toConfigDomain(result);
    }
}
