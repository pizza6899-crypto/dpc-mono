import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TierRepositoryPort } from '../ports/tier.repository.port';
import { TierMapper } from './tier.mapper';
import { generateUid } from 'src/utils/id.util';
import { Tier } from '../domain';
import { LockNamespace } from 'src/common/concurrency/lock-namespace';
import { DomainException } from 'src/common/exception/domain.exception';
import { MessageCode } from '@repo/shared';

@Injectable()
export class TierRepository implements TierRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterPrisma>,
        private readonly mapper: TierMapper,
    ) { }

    async findAll(): Promise<Tier[]> {
        const models = await this.tx.tier.findMany({
            orderBy: { priority: 'asc' },
            include: { translations: true },
        });
        return models.map(model => this.mapper.toDomain(model));
    }

    async findByCode(code: string): Promise<Tier | null> {
        const model = await this.tx.tier.findUnique({
            where: { code },
            include: { translations: true },
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async findByPriority(priority: number): Promise<Tier | null> {
        const model = await this.tx.tier.findUnique({
            where: { priority },
            include: { translations: true },
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async findById(id: bigint): Promise<Tier | null> {
        const model = await this.tx.tier.findUnique({
            where: { id },
            include: { translations: true },
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async create(tier: Tier): Promise<Tier> {
        const data = this.mapper.toPersistence(tier);
        const model = await this.tx.tier.create({
            data,
        });
        return this.mapper.toDomain(model);
    }

    async update(tier: Tier): Promise<Tier> {
        if (!tier.id) throw new Error('Tier ID is required for update');
        const data = this.mapper.toPersistence(tier);

        const model = await this.tx.tier.update({
            where: { id: tier.id },
            data,
            include: { translations: true },
        });
        return this.mapper.toDomain(model);
    }

    async acquireGlobalLock(): Promise<void> {
        try {
            // Set lock timeout to 3 seconds for current transaction
            await this.tx.$executeRaw`SET LOCAL lock_timeout = '3s'`;

            // Acquire advisory lock using TIER_CREATION namespace
            // Using a constant 0 as the second part of the key since this is a global lock for tier creation
            await this.tx.$executeRaw`SELECT pg_advisory_xact_lock(('x' || substr(md5(${LockNamespace.TIER_CREATION}::text || '0'), 1, 16))::bit(64)::bigint)`;
        } catch (error: any) {
            const isLockTimeout =
                error.code === '55P03' ||
                error.meta?.code === '55P03' ||
                error.message?.includes('55P03') ||
                error.message?.includes('lock timeout');

            if (isLockTimeout) {
                throw new DomainException(
                    'Another tier creation is being processed. Please try again.',
                    MessageCode.THROTTLE_TOO_MANY_REQUESTS,
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }
            throw error;
        }
    }

    async saveTranslation(tierId: bigint, language: string, name: string): Promise<void> {
        const existing = await this.tx.tierTranslation.findFirst({
            where: {
                tierId,
                language: language as any,
            },
        });

        if (existing) {
            await this.tx.tierTranslation.update({
                where: { id: existing.id },
                data: { name },
            });
        } else {
            await this.tx.tierTranslation.create({
                data: {
                    uid: generateUid(),
                    tierId,
                    language: language as any,
                    name,
                },
            });
        }
    }
}
