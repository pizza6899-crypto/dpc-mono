import { Injectable } from '@nestjs/common';
import { UserArtifactLog as PrismaUserArtifactLog } from '@prisma/client';
import { UserArtifactLog } from '../domain/user-artifact-log.entity';

@Injectable()
export class UserArtifactLogMapper {
  /**
   * Prisma 레코드를 도메인 엔티티로 변환
   */
  toEntity(record: PrismaUserArtifactLog): UserArtifactLog {
    return UserArtifactLog.rehydrate({
      id: record.id,
      userId: record.userId,
      artifactId: record.artifactId,
      type: record.type,
      grade: record.grade,
      cost: record.cost,
      currency: record.currency,
      details: record.details as any,
      createdAt: record.createdAt,
    });
  }

  /**
   * 도메인 엔티티를 Prisma 데이터로 변환
   */
  toPersistence(entity: UserArtifactLog): any {
    return {
      id: entity.id,
      userId: entity.userId,
      artifactId: entity.artifactId,
      type: entity.type,
      grade: entity.grade,
      cost: entity.cost,
      currency: entity.currency,
      details: entity.details as any,
      createdAt: entity.createdAt,
    };
  }
}
