import { Injectable } from '@nestjs/common';
import { UserArtifactPity as PrismaUserArtifactPity } from '@prisma/client';
import { UserArtifactPity } from '../domain/user-artifact-pity.entity';

@Injectable()
export class UserArtifactPityMapper {
  /**
   * Prisma 레코드를 도메인 엔티티로 변환
   */
  toEntity(record: PrismaUserArtifactPity): UserArtifactPity {
    return UserArtifactPity.rehydrate({
      userId: record.userId,
      grade: record.grade,
      synthesisFailureCount: record.synthesisFailureCount,
      synthesisTotalFailureCount: record.synthesisTotalFailureCount,
      drawTotalObtainCount: record.drawTotalObtainCount,
      updatedAt: record.updatedAt,
    });
  }

  /**
   * 도메인 엔티티를 Persistence 데이터로 변환
   */
  toPersistence(entity: UserArtifactPity): any {
    return {
      userId: entity.userId,
      grade: entity.grade,
      synthesisFailureCount: entity.synthesisFailureCount,
      synthesisTotalFailureCount: entity.synthesisTotalFailureCount,
      drawTotalObtainCount: entity.drawTotalObtainCount,
      updatedAt: entity.updatedAt,
    };
  }
}
