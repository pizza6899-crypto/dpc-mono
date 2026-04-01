import { Injectable } from '@nestjs/common';
import { UserArtifact as PrismaUserArtifact } from '@prisma/client';
import { UserArtifact } from '../domain/user-artifact.entity';
import { ArtifactCatalogMapper } from '../../master/infrastructure/artifact-catalog.mapper';

@Injectable()
export class UserArtifactMapper {
  constructor(private readonly catalogMapper: ArtifactCatalogMapper) { }

  /**
   * Prisma 레코드를 도메인 엔티티로 변환
   */
  toEntity(record: any): UserArtifact {
    return UserArtifact.rehydrate({
      id: record.id,
      userId: record.userId,
      artifactId: record.artifactId,
      slotNo: record.slotNo,
      isEquipped: record.isEquipped,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      catalog: record.artifact ? this.catalogMapper.toEntity(record.artifact) : undefined,
    });
  }

  /**
   * 도메인 엔티티를 Persistence 데이터로 변환 (ID 불변)
   */
  toPersistence(entity: UserArtifact): any {
    return {
      userId: entity.userId,
      artifactId: entity.artifactId,
      slotNo: entity.slotNo,
      isEquipped: entity.isEquipped,
      createdAt: entity.createdAt,
      // updatedAt은 Prisma에서 자동으로 처리 (@updatedAt)
    };
  }
}
