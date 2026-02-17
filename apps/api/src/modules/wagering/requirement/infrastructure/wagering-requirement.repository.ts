import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type { WageringRequirementRepositoryPort } from '../ports';
import { WageringRequirement, WageringRequirementException, WageringRequirementNotFoundException, WageringContributionLog } from '../domain';
import { WageringRequirementMapper } from './wagering-requirement.mapper';
import { Prisma, type ExchangeCurrencyCode, type WageringStatus, type WageringSourceType } from '@prisma/client';
import type { PaginatedData } from 'src/common/http/types/pagination.types';

import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

@Injectable()
export class WageringRequirementRepository implements WageringRequirementRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: WageringRequirementMapper,
        private readonly snowflakeService: SnowflakeService,
    ) { }

    async create(wageringRequirement: WageringRequirement): Promise<WageringRequirement> {
        const data = this.mapper.toPrisma(wageringRequirement);
        const result = await this.tx.wageringRequirement.create({
            data: data as any,
        });
        return this.mapper.toDomain(result);
    }

    async findActiveByUserIdAndCurrency(userId: bigint, currency: ExchangeCurrencyCode): Promise<WageringRequirement[]> {
        const results = await this.tx.wageringRequirement.findMany({
            where: {
                userId,
                currency,
                status: 'ACTIVE',
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' },
            ],
        });
        return results.map((r) => this.mapper.toDomain(r));
    }

    async save(wageringRequirement: WageringRequirement): Promise<WageringRequirement> {
        if (!wageringRequirement.id) {
            throw new WageringRequirementException('Cannot save wagering requirement without ID. Use create() for new requirements.');
        }

        const data = this.mapper.toPrisma(wageringRequirement);

        const result = await this.tx.wageringRequirement.update({
            where: { id: wageringRequirement.id },
            data: data as any,
        });

        return this.mapper.toDomain(result);
    }

    async findLatestBySource(userId: bigint, sourceType: WageringSourceType, sourceId: bigint): Promise<WageringRequirement | null> {
        const result = await this.tx.wageringRequirement.findFirst({
            where: {
                userId,
                sourceType,
                sourceId,
            },
            orderBy: { createdAt: 'desc' },
        });

        return result ? this.mapper.toDomain(result) : null;
    }

    async findById(id: bigint): Promise<WageringRequirement | null> {
        const result = await this.tx.wageringRequirement.findUnique({
            where: { id },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async getById(id: bigint): Promise<WageringRequirement> {
        const requirement = await this.findById(id);
        if (!requirement) {
            throw new WageringRequirementNotFoundException();
        }
        return requirement;
    }

    async findByUserId(userId: bigint, status?: WageringStatus): Promise<WageringRequirement[]> {
        const results = await this.tx.wageringRequirement.findMany({
            where: {
                userId,
                status,
            },
            orderBy: { createdAt: 'desc' },
        });
        return results.map((r) => this.mapper.toDomain(r));
    }

    async findPaginated(params: {
        userId?: bigint;
        statuses?: WageringStatus[];
        sourceType?: WageringSourceType;
        sourceId?: bigint;
        currency?: ExchangeCurrencyCode;
        fromAt?: Date;
        toAt?: Date;
        page: number;
        limit: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<PaginatedData<WageringRequirement>> {
        const { userId, statuses, sourceType, sourceId, currency, fromAt, toAt, page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (userId) {
            where.userId = userId;
        }

        if (statuses && statuses.length > 0) {
            where.status = { in: statuses };
        }

        if (sourceType) {
            where.sourceType = sourceType;
        }

        if (sourceId) {
            where.sourceId = sourceId;
        }

        if (currency) {
            where.currency = currency;
        }

        if (fromAt || toAt) {
            where.createdAt = {
                gte: fromAt ?? undefined,
                lte: toAt ?? undefined,
            };
        }

        const [total, results] = await Promise.all([
            this.tx.wageringRequirement.count({ where }),
            this.tx.wageringRequirement.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy as any]: sortOrder },
            }),
        ]);

        return {
            data: results.map((r) => this.mapper.toDomain(r)),
            total,
            page,
            limit,
        };
    }
}
