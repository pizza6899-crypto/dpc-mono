import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ForbiddenWordRepositoryPort } from '../ports/out/moderation-repository.port';
import { ForbiddenWord as ForbiddenWordEntity } from '../domain/model/forbidden-word.entity';

@Injectable()
export class PrismaForbiddenWordRepository implements ForbiddenWordRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async findAllActive(): Promise<ForbiddenWordEntity[]> {
        const records = await this.tx.forbiddenWord.findMany({
            where: { isActive: true },
        });

        return records.map(record => ForbiddenWordEntity.fromPersistence(record));
    }

    async findById(id: bigint): Promise<ForbiddenWordEntity | null> {
        const record = await this.tx.forbiddenWord.findUnique({
            where: { id },
        });

        if (!record) return null;
        return ForbiddenWordEntity.fromPersistence(record);
    }

    async findByWord(word: string): Promise<ForbiddenWordEntity | null> {
        const record = await this.tx.forbiddenWord.findUnique({
            where: { word: word.toLowerCase().trim() },
        });

        if (!record) return null;
        return ForbiddenWordEntity.fromPersistence(record);
    }

    async exists(word: string): Promise<boolean> {
        const count = await this.tx.forbiddenWord.count({
            where: {
                word: word.toLowerCase().trim(),
                isActive: true
            },
        });
        return count > 0;
    }

    private async save(forbiddenWord: ForbiddenWordEntity): Promise<void> {
        await this.tx.forbiddenWord.upsert({
            where: { word: forbiddenWord.word },
            update: {
                description: forbiddenWord.description,
                isActive: forbiddenWord.isActive,
                updatedAt: new Date(),
            },
            create: {
                word: forbiddenWord.word,
                description: forbiddenWord.description,
                isActive: forbiddenWord.isActive,
            },
        });
    }

    async saveAll(forbiddenWords: ForbiddenWordEntity[]): Promise<void> {
        // 병렬 upsert 처리 (단일 트랜잭션 대신 개별 upsert가 중복 방어에 안전함)
        await Promise.all(
            forbiddenWords.map(word => this.save(word))
        );
    }

    async findMany(params: {
        skip: number;
        take: number;
        keyword?: string;
        isActive?: boolean;
    }): Promise<ForbiddenWordEntity[]> {
        const records = await this.tx.forbiddenWord.findMany({
            where: {
                isActive: params.isActive,
                word: params.keyword ? { contains: params.keyword } : undefined,
            },
            skip: params.skip,
            take: params.take,
            orderBy: { createdAt: 'desc' },
        });

        return records.map(record => ForbiddenWordEntity.fromPersistence(record));
    }

    async count(params: { keyword?: string; isActive?: boolean }): Promise<number> {
        return await this.tx.forbiddenWord.count({
            where: {
                isActive: params.isActive,
                word: params.keyword ? { contains: params.keyword } : undefined,
            },
        });
    }

    async update(id: bigint, data: { description?: string; isActive?: boolean }): Promise<void> {
        await this.tx.forbiddenWord.update({
            where: { id },
            data: {
                description: data.description,
                isActive: data.isActive,
                updatedAt: new Date(),
            },
        });
    }

    async delete(id: bigint): Promise<void> {
        await this.tx.forbiddenWord.delete({
            where: { id },
        });
    }

    async create(forbiddenWord: ForbiddenWordEntity): Promise<void> {
        await this.tx.forbiddenWord.create({
            data: {
                word: forbiddenWord.word,
                description: forbiddenWord.description,
                isActive: forbiddenWord.isActive,
            },
        });
    }
}
