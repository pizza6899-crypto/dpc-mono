import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { FileEntity, FileValidationException } from '../domain';
import { FileRepositoryPort } from '../ports/file.repository.port';
import { FileMapper } from './file.mapper';

@Injectable()
export class FileRepository implements FileRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: FileMapper,
  ) {}

  async create(file: FileEntity): Promise<FileEntity> {
    const data = this.mapper.toPrisma(file);
    const result = await this.tx.file.create({ data });
    return this.mapper.toDomain(result);
  }

  async update(file: FileEntity): Promise<FileEntity> {
    if (!file.id) {
      throw new FileValidationException('Cannot update file without ID');
    }
    const data = this.mapper.toPrisma(file);
    const result = await this.tx.file.update({
      where: { id: file.id },
      data,
    });
    return this.mapper.toDomain(result);
  }

  async findById(id: bigint): Promise<FileEntity | null> {
    const result = await this.tx.file.findUnique({ where: { id } });
    return result ? this.mapper.toDomain(result) : null;
  }

  async findByIds(ids: bigint[]): Promise<FileEntity[]> {
    const results = await this.tx.file.findMany({
      where: {
        id: { in: ids },
      },
    });
    return results.map((r) => this.mapper.toDomain(r));
  }

  async findByKey(key: string): Promise<FileEntity | null> {
    const result = await this.tx.file.findUnique({ where: { key } });
    return result ? this.mapper.toDomain(result) : null;
  }

  async delete(id: bigint): Promise<void> {
    await this.tx.file.delete({ where: { id } });
  }
}
