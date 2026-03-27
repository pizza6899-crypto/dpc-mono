import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserArtifactRepositoryPort } from '../ports/user-artifact.repository.port';
import { UserArtifact } from '../domain/user-artifact.entity';
import { UserArtifactMapper } from './user-artifact.mapper';

/**
 * Prisma 기반의 개별 유물 보유(Inventory) 저장소 구현
 */
@Injectable()
export class PrismaUserArtifactRepository implements UserArtifactRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: UserArtifactMapper,
  ) { }

  /**
   * 유저별 보유 유물 목록 조회
   */
  async findByUserId(userId: bigint): Promise<UserArtifact[]> {
    const records = await this.tx.userArtifact.findMany({
      where: { userId },
    });
    return records.map(record => this.mapper.toEntity(record));
  }

  /**
   * 특정 유물 보유 내역 조회
   */
  async findById(id: bigint): Promise<UserArtifact | null> {
    const record = await this.tx.userArtifact.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.mapper.toEntity(record);
  }

  /**
   * 신규 유물 저장 (단일)
   */
  async save(entity: UserArtifact): Promise<UserArtifact> {
    const data = this.mapper.toPersistence(entity);
    const result = await this.tx.userArtifact.create({
      data,
    });
    return this.mapper.toEntity(result);
  }

  /**
   * 복수 유물 저장 (트랜잭션 내에서 처리 권장)
   */
  async saveAll(entities: UserArtifact[]): Promise<UserArtifact[]> {
    // Prisma.createMany는 생성된 ID를 반환하지 않으므로, ID가 필요한 경우 개별 생성하거나 $transaction 필요
    // 여기서는 간단하게 개별 생성 후 맵핑
    const results = await Promise.all(
      entities.map(entity => this.save(entity))
    );
    return results;
  }

  /**
   * 유치 정보 업데이트 (장착/해제용)
   */
  async update(entity: UserArtifact): Promise<UserArtifact> {
    const data = this.mapper.toPersistence(entity);
    const result = await this.tx.userArtifact.update({
      where: { id: entity.id },
      data,
    });
    return this.mapper.toEntity(result);
  }
}
