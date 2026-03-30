import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type { WageringContributionLogRepositoryPort } from '../ports';
import { WageringContributionLog } from '../domain';
import { WageringRequirementMapper } from './wagering-requirement.mapper';
import { Prisma } from '@prisma/client';
import { SnowflakeService } from 'src/infrastructure/snowflake/snowflake.service';

@Injectable()
export class WageringContributionLogRepository implements WageringContributionLogRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: WageringRequirementMapper,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  async create(data: {
    wageringRequirementId: bigint;
    gameRoundId: bigint;
    requestAmount: Prisma.Decimal;
    contributionRate: Prisma.Decimal;
    wageredAmount: Prisma.Decimal;
  }): Promise<void> {
    const { id: logId, timestamp } = this.snowflakeService.generate();

    await this.tx.wageringContributionLog.create({
      data: {
        id: logId,
        createdAt: timestamp,
        ...data,
      },
    });
  }

  async findByRequirementId(
    wageringRequirementId: bigint,
  ): Promise<WageringContributionLog[]> {
    const results = await this.tx.wageringContributionLog.findMany({
      where: { wageringRequirementId },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((r) => this.mapper.toDomainLog(r));
  }

  async findByGameRoundId(gameRoundId: bigint): Promise<WageringContributionLog[]> {
    const results = await this.tx.wageringContributionLog.findMany({
      where: { gameRoundId },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((r) => this.mapper.toDomainLog(r));
  }
}
