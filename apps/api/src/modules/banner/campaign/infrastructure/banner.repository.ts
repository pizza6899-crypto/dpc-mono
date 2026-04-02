import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type { Banner } from '../domain/banner.entity';
import type { Language } from '@prisma/client';
import type { BannerRepositoryPort } from '../ports/banner.repository.port';
import { BannerMapper } from './banner.mapper';
import {
  BannerNotFoundException,
  BannerInvalidStateException,
} from '../domain/banner.errors';

@Injectable()
export class BannerRepository implements BannerRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: BannerMapper,
  ) {}

  async findById(id: bigint): Promise<Banner | null> {
    const result = await this.tx.banner.findUnique({
      where: { id },
      include: { translations: true },
    });
    return result ? this.mapper.toDomain(result as any) : null;
  }

  async getById(id: bigint): Promise<Banner> {
    const banner = await this.findById(id);
    if (!banner) throw new BannerNotFoundException();
    return banner;
  }

  async list(options?: {
    isActive?: boolean;
    language?: Language;
    now?: Date;
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
  }): Promise<Banner[]> {
    const where: any = {};
    if (options?.isActive !== undefined) where.isActive = options.isActive;
    if (options?.now) {
      where.startDate = { lte: options.now };
      where.endDate = { gte: options.now };
    }
    // 기본적으로 삭제된 레코드는 제외
    if (!options?.includeDeleted) where.deletedAt = null;

    const result = await this.tx.banner.findMany({
      where,
      include: {
        translations: options?.language ? { where: { language: options.language } } : true,
      },
      orderBy: { order: 'asc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return result.map((row) => this.mapper.toDomain(row as any));
  }

  async count(options?: { isActive?: boolean; now?: Date; includeDeleted?: boolean }): Promise<number> {
    const where: any = {};
    if (options?.isActive !== undefined) where.isActive = options.isActive;
    if (options?.now) {
      where.startDate = { lte: options.now };
      where.endDate = { gte: options.now };
    }
    if (!options?.includeDeleted) where.deletedAt = null;
    return await this.tx.banner.count({ where });
  }

  async create(banner: Banner): Promise<Banner> {
    const data = this.mapper.toPrisma(banner);
    const translations = this.mapper.toPrismaTranslations(banner);

    const result = await this.tx.banner.create({
      data: {
        ...data,
        translations: {
          create: translations,
        },
      },
      include: { translations: true },
    });

    return this.mapper.toDomain(result as any);
  }

  async update(banner: Banner): Promise<Banner> {
    if (!banner.id) {
      throw new BannerInvalidStateException('Banner id is required for update');
    }

    const data = this.mapper.toPrisma(banner);
    const translations = this.mapper.toPrismaTranslations(banner);

    await this.tx.bannerTranslation.deleteMany({ where: { bannerId: banner.id } });

    const result = await this.tx.banner.update({
      where: { id: banner.id },
      data: {
        ...data,
        translations: {
          create: translations,
        },
      },
      include: { translations: true },
    });

    return this.mapper.toDomain(result as any);
  }

  async delete(id: bigint): Promise<void> {
    // soft-delete: set deletedAt timestamp
    await this.tx.banner.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
