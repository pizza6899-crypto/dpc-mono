import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { FileEntity } from '../domain';
import { FileRepositoryPort } from '../ports/file.repository.port';
import { FileMapper } from './file.mapper';

@Injectable()
export class FileRepository implements FileRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterPrisma>,
        private readonly mapper: FileMapper,
    ) { }

    async create(file: FileEntity): Promise<FileEntity> {
        const data = this.mapper.toPrisma(file);
        const result = await this.tx.file.create({ data });
        return this.mapper.toDomain(result);
    }

    async findById(id: bigint): Promise<FileEntity | null> {
        const result = await this.tx.file.findUnique({ where: { id } });
        return result ? this.mapper.toDomain(result) : null;
    }

    async findByKey(key: string): Promise<FileEntity | null> {
        const result = await this.tx.file.findUnique({ where: { key } });
        return result ? this.mapper.toDomain(result) : null;
    }

    async delete(id: bigint): Promise<void> {
        // Hard delete or soft delete? Schema has 'DELETED' status. 
        // Usually delete means soft delete or removing from DB.
        // If adhering to schema status, maybe I should update status.
        // But the port says 'delete'. 
        // I will implement hard delete for now, or use update status?
        // Let's implement hard delete here, but Use Case can decide.
        // Actually, schema has `status`.
        // Let's implement hard delete in repository 'delete' method.
        // If soft delete is needed, I should have 'update' method.
        // But wait, my usage in port is 'delete'.
        // I will assume hard delete or throw error if not intended.
        // Let's just implement hard delete for now.
        await this.tx.file.delete({ where: { id } });
    }
}
