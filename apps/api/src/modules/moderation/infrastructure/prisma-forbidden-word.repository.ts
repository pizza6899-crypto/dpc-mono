import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ForbiddenWordRepositoryPort } from '../ports/out/moderation-repository.port';
import { ForbiddenWord as ForbiddenWordEntity } from '../domain/model/forbidden-word.entity';

@Injectable()
export class PrismaForbiddenWordRepository implements ForbiddenWordRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }

    async findAllActive(): Promise<ForbiddenWordEntity[]> {
        const records = await this.prisma.forbiddenWord.findMany({
            where: { isActive: true },
        });

        return records.map(record => ForbiddenWordEntity.fromPersistence(record));
    }

    async findByWord(word: string): Promise<ForbiddenWordEntity | null> {
        const record = await this.prisma.forbiddenWord.findUnique({
            where: { word: word.toLowerCase().trim() },
        });

        if (!record) return null;
        return ForbiddenWordEntity.fromPersistence(record);
    }

    async exists(word: string): Promise<boolean> {
        const count = await this.prisma.forbiddenWord.count({
            where: {
                word: word.toLowerCase().trim(),
                isActive: true
            },
        });
        return count > 0;
    }

    private async save(forbiddenWord: ForbiddenWordEntity): Promise<void> {
        await this.prisma.forbiddenWord.upsert({
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
}
