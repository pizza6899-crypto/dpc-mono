import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { LevelDefinition } from '../domain/level-definition.entity';
import { LevelDefinitionRepositoryPort } from '../ports/level-definition.repository.port';
import { LevelDefinitionMapper } from './level-definition.mapper';

@Injectable()
export class PrismaLevelDefinitionRepository implements LevelDefinitionRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: LevelDefinitionMapper,
  ) { }

  async findLevelDefinition(level: number): Promise<LevelDefinition | null> {
    const record = await this.tx.levelDefinition.findUnique({
      where: { level },
    });

    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async findAllLevelDefinitions(): Promise<LevelDefinition[]> {
    const records = await this.tx.levelDefinition.findMany({
      orderBy: { level: 'asc' },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }
}
