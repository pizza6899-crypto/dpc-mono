import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ItemCatalog } from '../domain/item-catalog.entity';
import { ItemCatalogRepositoryPort } from '../ports/item-catalog.repository.port';
import { ItemCatalogMapper } from './item-catalog.mapper';

@Injectable()
export class PrismaItemCatalogRepository implements ItemCatalogRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: ItemCatalogMapper,
  ) { }

  async findById(id: bigint): Promise<ItemCatalog | null> {
    const record = await this.tx.itemCatalog.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async findByCode(code: string): Promise<ItemCatalog | null> {
    const record = await this.tx.itemCatalog.findUnique({
      where: { code },
      include: { translations: true },
    });

    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async findAllItems(): Promise<ItemCatalog[]> {
    const records = await this.tx.itemCatalog.findMany({
      include: { translations: true },
      orderBy: { code: 'asc' },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }
}
