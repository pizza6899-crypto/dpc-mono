import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { GamificationConfig } from '../domain/gamification-config.entity';
import { GamificationConfigRepositoryPort } from '../ports/gamification-config.repository.port';
import { GamificationConfigMapper } from './gamification-config.mapper';

@Injectable()
export class PrismaGamificationConfigRepository implements GamificationConfigRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: GamificationConfigMapper,
  ) { }

  async findConfig(): Promise<GamificationConfig | null> {
    const record = await this.tx.gamificationConfig.findFirst({
      where: { id: GamificationConfig.CONFIG_ID },
    });

    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async saveConfig(config: GamificationConfig): Promise<void> {
    const data = this.mapper.toPrismaUpsert(config);
    await this.tx.gamificationConfig.upsert({
      where: { id: GamificationConfig.CONFIG_ID },
      update: data,
      create: data,
    });
  }
}
