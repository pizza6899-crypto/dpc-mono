import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type { WageringRequirementRepositoryPort } from '../ports';
import { WageringRequirement, WageringRequirementException, WageringRequirementNotFoundException } from '../domain';
import { WageringRequirementMapper } from './wagering-requirement.mapper';
import type { ExchangeCurrencyCode, WageringStatus } from '@repo/database';
import type { PaginatedData } from 'src/common/http/types/pagination.types';

@Injectable()
export class WageringRequirementRepository implements WageringRequirementRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: WageringRequirementMapper,
    ) { }

    async create(wageringRequirement: WageringRequirement): Promise<WageringRequirement> {
        const data = this.mapper.toPrisma(wageringRequirement);
        const result = await this.tx.wageringRequirement.create({
            data,
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

    async save(
        wageringRequirement: WageringRequirement,
        logData?: {
            gameRoundId: bigint;
            requestAmount: any;
            contributionRate: any;
            contributedAmount: any;
        },
    ): Promise<WageringRequirement> {
        if (!wageringRequirement.id) {
            throw new WageringRequirementException('Cannot save wagering requirement without ID. Use create() for new requirements.');
        }

        const data = this.mapper.toPrisma(wageringRequirement);

        // Update WageringRequirement
        const result = await this.tx.wageringRequirement.update({
            where: { id: wageringRequirement.id },
            data,
        });

        // Create Log if provided
        if (logData) {
            await this.tx.wageringContributionLog.create({
                data: {
                    wageringRequirementId: wageringRequirement.id,
                    gameRoundId: logData.gameRoundId,
                    requestAmount: logData.requestAmount,
                    contributionRate: logData.contributionRate,
                    contributedAmount: logData.contributedAmount,
                },
            });
        }

        return this.mapper.toDomain(result);
    }

    async findById(id: bigint): Promise<WageringRequirement | null> {
        const result = await this.tx.wageringRequirement.findUnique({
            where: { id },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async findByUid(uid: string): Promise<WageringRequirement | null> {
        const result = await this.tx.wageringRequirement.findUnique({
            where: { uid },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async getByUid(uid: string): Promise<WageringRequirement> {
        const requirement = await this.findByUid(uid);
        if (!requirement) {
            throw new WageringRequirementNotFoundException(uid);
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
        userId: bigint;
        statuses?: WageringStatus[];
        page: number;
        limit: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<PaginatedData<WageringRequirement>> {
        const { userId, statuses, page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = params;
        const skip = (page - 1) * limit;

        const where: any = {
            userId,
        };

        if (statuses && statuses.length > 0) {
            where.status = { in: statuses };
        }

        const [total, results] = await Promise.all([
            this.tx.wageringRequirement.count({ where }),
            this.tx.wageringRequirement.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
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
