import { Injectable } from '@nestjs/common';
import { ArtifactLogType, Prisma } from '@prisma/client';
import { ArtifactBonusPoolLogDetails, ArtifactBonusPoolLog } from '../domain/artifact-bonus-pool-log.entity';
import { ArtifactBonusPoolLogRepositoryPort } from '../ports/artifact-bonus-pool-log.repository.port';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

export interface CreateArtifactBonusPoolLogCommand {
  userId?: bigint | null;
  amountUsd: Prisma.Decimal;
  type: ArtifactLogType;
  details?: ArtifactBonusPoolLogDetails | null;
}

/**
 * [Audit] 보너스 풀 변동 로그 생성 서비스
 */
@Injectable()
export class CreateArtifactBonusPoolLogService {
  constructor(
    private readonly logRepo: ArtifactBonusPoolLogRepositoryPort,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  async execute(command: CreateArtifactBonusPoolLogCommand): Promise<ArtifactBonusPoolLog> {
    const { id, timestamp } = this.snowflakeService.generate();

    const log = ArtifactBonusPoolLog.create({
      id,
      createdAt: timestamp,
      ...command,
    });

    return await this.logRepo.create(log);
  }
}
