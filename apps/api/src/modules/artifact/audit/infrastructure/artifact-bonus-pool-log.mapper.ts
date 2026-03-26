import { Injectable } from '@nestjs/common';
import { ArtifactBonusPoolLog as PrismaArtifactBonusPoolLog } from '@prisma/client';
import { ArtifactBonusPoolLog } from '../domain/artifact-bonus-pool-log.entity';

@Injectable()
export class ArtifactBonusPoolLogMapper {
  /**
   * Prisma 레코드를 도메인 엔티티로 변환
   */
  toEntity(record: PrismaArtifactBonusPoolLog): ArtifactBonusPoolLog {
    return ArtifactBonusPoolLog.rehydrate({
      id: record.id,
      userId: record.userId,
      amountUsd: record.amountUsd,
      type: record.type,
      details: record.details as any,
      createdAt: record.createdAt,
    });
  }

  /**
   * 도메인 엔티티를 Prisma 데이터로 변환
   */
  toPersistence(entity: ArtifactBonusPoolLog): any {
    return {
      id: entity.id,
      userId: entity.userId,
      amountUsd: entity.amountUsd,
      type: entity.type,
      details: entity.details as any,
      createdAt: entity.createdAt,
    };
  }
}
