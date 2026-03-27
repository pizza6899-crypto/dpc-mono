import { Injectable } from '@nestjs/common';
import { ArtifactGrade, ArtifactLogType, Prisma } from '@prisma/client';
import { UserArtifactLogRepositoryPort } from '../ports/user-artifact-log.repository.port';
import { UserArtifactLogDetails, UserArtifactLog } from '../domain/user-artifact-log.entity';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

export interface CreateUserArtifactLogCommand {
  userId?: bigint | null;
  artifactId?: bigint | null;
  type: ArtifactLogType;
  grade?: ArtifactGrade | null;
  amountUsd?: Prisma.Decimal | null;
  details?: UserArtifactLogDetails | null;
}

/**
 * [Audit] 유물 활동 로그 생성 서비스
 */
@Injectable()
export class CreateUserArtifactLogService {
  constructor(
    private readonly logRepo: UserArtifactLogRepositoryPort,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  async execute(command: CreateUserArtifactLogCommand): Promise<UserArtifactLog> {
    const { id, timestamp } = this.snowflakeService.generate();

    const log = UserArtifactLog.create({
      id,
      createdAt: timestamp,
      ...command,
    });

    return await this.logRepo.create(log);
  }
}
