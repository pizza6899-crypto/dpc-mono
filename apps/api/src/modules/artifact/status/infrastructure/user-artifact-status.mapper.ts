import { Injectable } from '@nestjs/common';
import { UserArtifactStatus as PrismaUserArtifactStatus } from '@prisma/client';
import { UserArtifactStatus } from '../domain/user-artifact-status.entity';

@Injectable()
export class UserArtifactStatusMapper {
  /**
   * Prisma 레코드를 도메인 엔티티로 변환
   */
  toEntity(record: PrismaUserArtifactStatus): UserArtifactStatus {
    return UserArtifactStatus.rehydrate({
      userId: record.userId,
      activeSlotCount: record.activeSlotCount,
      totalDrawCount: record.totalDrawCount,
      totalSynthesisCount: record.totalSynthesisCount,
      updatedAt: record.updatedAt,
    });
  }

  /**
   * 도메인 엔티티를 Persistence 데이터로 변환 (ID 불변)
   */
  toPersistence(entity: UserArtifactStatus): any {
    return {
      userId: entity.userId,
      activeSlotCount: entity.activeSlotCount,
      totalDrawCount: entity.totalDrawCount,
      totalSynthesisCount: entity.totalSynthesisCount,
      updatedAt: entity.updatedAt,
    };
  }
}
