import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CategoryRepositoryPort } from '../ports';
import { CasinoGameCategory, CategoryNotFoundException } from '../domain';
import { CategoryMapper } from './category.mapper';

@Injectable()
export class CategoryRepository implements CategoryRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: CategoryMapper,
    ) { }

    async findById(id: bigint): Promise<CasinoGameCategory | null> {
        const result = await this.tx.casinoGameCategory.findUnique({
            where: { id },
            include: { translations: true },
        });
        return result ? this.mapper.toDomain(result as any) : null;
    }

    async getById(id: bigint): Promise<CasinoGameCategory> {
        const category = await this.findById(id);
        if (!category) throw new CategoryNotFoundException(id);
        return category;
    }

    async findByCode(code: string): Promise<CasinoGameCategory | null> {
        const result = await this.tx.casinoGameCategory.findUnique({
            where: { code },
            include: { translations: true },
        });
        return result ? this.mapper.toDomain(result as any) : null;
    }

    async getByCode(code: string): Promise<CasinoGameCategory> {
        const category = await this.findByCode(code);
        if (!category) throw new CategoryNotFoundException(code);
        return category;
    }

    async list(options?: { isActive?: boolean; limit?: number; offset?: number }): Promise<CasinoGameCategory[]> {
        const result = await this.tx.casinoGameCategory.findMany({
            where: options?.isActive !== undefined ? { isActive: options.isActive } : {},
            include: { translations: true },
            orderBy: { sortOrder: 'asc' },
            take: options?.limit,
            skip: options?.offset,
        });
        return result.map((r) => this.mapper.toDomain(r as any));
    }

    async count(options?: { isActive?: boolean }): Promise<number> {
        return await this.tx.casinoGameCategory.count({
            where: options?.isActive !== undefined ? { isActive: options.isActive } : {},
        });
    }

    async create(category: CasinoGameCategory): Promise<CasinoGameCategory> {
        const data = this.mapper.toPrisma(category);
        const translations = this.mapper.toPrismaTranslations(category);

        const result = await this.tx.casinoGameCategory.create({
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

    async update(category: CasinoGameCategory): Promise<CasinoGameCategory> {
        if (!category.id) throw new Error('Category ID is required for update');

        const data = this.mapper.toPrisma(category);
        const translations = this.mapper.toPrismaTranslations(category);

        await this.tx.casinoGameCategoryTranslation.deleteMany({
            where: { categoryId: category.id },
        });

        const result = await this.tx.casinoGameCategory.update({
            where: { id: category.id },
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
        await this.tx.casinoGameCategory.delete({
            where: { id },
        });
    }
}
