import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { FileUsageEntity, FileUsageType } from '../domain';
import { FileUsageRepositoryPort } from '../ports/file-usage.repository.port';
import { FileUsageMapper } from './file-usage.mapper';

@Injectable()
export class FileUsageRepository implements FileUsageRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterPrisma>,
        private readonly mapper: FileUsageMapper,
    ) { }

    async create(fileUsage: FileUsageEntity): Promise<FileUsageEntity> {
        const data = this.mapper.toPrisma(fileUsage);
        const result = await this.tx.fileUsage.create({ data });
        return this.mapper.toDomain(result);
    }

    async delete(id: bigint): Promise<void> {
        await this.tx.fileUsage.delete({ where: { id } });
    }

    async deleteByUsage(usageType: FileUsageType, usageId: bigint): Promise<void> {
        await this.tx.fileUsage.deleteMany({
            where: {
                usageType,
                usageId,
            },
        });
    }

    async deleteByFileId(fileId: bigint): Promise<void> {
        await this.tx.fileUsage.deleteMany({
            where: {
                fileId,
            },
        });
    }

    async findByUsage(usageType: FileUsageType, usageId: bigint): Promise<FileUsageEntity[]> {
        const results = await this.tx.fileUsage.findMany({
            where: {
                usageType,
                usageId,
            },
            orderBy: {
                order: 'asc',
            },
        });
        return results.map(r => this.mapper.toDomain(r));
    }

    async findByFileId(fileId: bigint): Promise<FileUsageEntity[]> {
        const results = await this.tx.fileUsage.findMany({
            where: {
                fileId,
            },
        });
        return results.map(r => this.mapper.toDomain(r));
    }
}
