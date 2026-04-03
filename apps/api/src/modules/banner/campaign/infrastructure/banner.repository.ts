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
    includeSoftDeleted?: boolean;
    search?: string;
    startDateFrom?: Date | undefined;
    startDateTo?: Date | undefined;
    endDateFrom?: Date | undefined;
    endDateTo?: Date | undefined;
  }): Promise<Banner[]> {
    const where: any = {};
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    // Time filters
    if (options?.startDateFrom || options?.startDateTo) {
      where.startDate = {};
      if (options.startDateFrom) where.startDate.gte = options.startDateFrom;
      if (options.startDateTo) where.startDate.lte = options.startDateTo;
    }
    if (options?.endDateFrom || options?.endDateTo) {
      where.endDate = {};
      if (options.endDateFrom) where.endDate.gte = options.endDateFrom;
      if (options.endDateTo) where.endDate.lte = options.endDateTo;
    }

    // now filter (legacy behavior)
    if (options?.now) {
      where.startDate = { lte: options.now };
      where.endDate = { gte: options.now };
    }

    // 기본적으로 삭제된 레코드는 제외
    if (!options?.includeSoftDeleted) where.deletedAt = null;

    // Search by name or translation title
    const include: any = {};
    if (options?.language) {
      include.translations = { where: { language: options.language } };
    } else {
      include.translations = true;
    }

    if (options?.search) {
      where.AND = [
        where,
        {
          OR: [
            { name: { contains: options.search, mode: 'insensitive' } },
            { translations: { some: { title: { contains: options.search, mode: 'insensitive' } } } },
          ],
        },
      ];
    }

    const result = await this.tx.banner.findMany({
      where,
      include,
      orderBy: { order: 'asc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return result.map((row) => this.mapper.toDomain(row as any));
  }

  async count(options?: { isActive?: boolean; now?: Date; includeSoftDeleted?: boolean; search?: string; startDateFrom?: Date | undefined; startDateTo?: Date | undefined; endDateFrom?: Date | undefined; endDateTo?: Date | undefined }): Promise<number> {
    const where: any = {};
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    // Time range filters
    if (options?.startDateFrom || options?.startDateTo) {
      where.startDate = {};
      if (options.startDateFrom) where.startDate.gte = options.startDateFrom;
      if (options.startDateTo) where.startDate.lte = options.startDateTo;
    }
    if (options?.endDateFrom || options?.endDateTo) {
      where.endDate = {};
      if (options.endDateFrom) where.endDate.gte = options.endDateFrom;
      if (options.endDateTo) where.endDate.lte = options.endDateTo;
    }

    // now filter (legacy behavior)
    if (options?.now) {
      where.startDate = { lte: options.now };
      where.endDate = { gte: options.now };
    }

    if (!options?.includeSoftDeleted) where.deletedAt = null;

    // Apply search across name and translation titles
    if (options?.search) {
      where.AND = [
        where,
        {
          OR: [
            { name: { contains: options.search, mode: 'insensitive' } },
            { translations: { some: { title: { contains: options.search, mode: 'insensitive' } } } },
          ],
        },
      ];
    }

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
