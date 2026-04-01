import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { ArtifactGrade } from '@prisma/client';
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
      include: { artifact: true },
    });
    return records.map(record => this.mapper.toEntity(record));
  }

  /**
   * 유저의 보유 유물 페이지네이션 조회 (Catalog 정보 포함, 필터 및 정렬 지원)
   */
  async findManyByUserId(
    userId: bigint,
    options: {
      skip: number;
      take: number;
      grades?: ArtifactGrade[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<[UserArtifact[], number]> {
    const { skip, take, grades, sortBy, sortOrder } = options;

    // 필터 조건 구성
    const where: any = { userId };
    if (grades && grades.length > 0) {
      where.artifact = { grade: { in: grades } };
    }

    // 정렬 조건 구성
    const orderBy: any[] = [];
    if (sortBy === 'grade') {
      // 1. 등급순 (Enum 정의 순서)
      orderBy.push({ artifact: { grade: sortOrder || 'asc' } });
      // 2. 동일 등급 내에서는 최신 획득순 (Fallback)
      orderBy.push({ createdAt: 'desc' });
    } else if (sortBy === 'id') {
      orderBy.push({ id: sortOrder || 'desc' });
    } else if (sortBy === 'acquiredAt') {
      orderBy.push({ createdAt: sortOrder || 'desc' });
    } else {
      // 기본값: 최신 획득순
      orderBy.push({ createdAt: 'desc' });
    }

    // 최종 안정 정렬을 위한 PK 추가
    if (!orderBy.some(o => o.id)) {
      orderBy.push({ id: 'desc' });
    }

    console.log(`[Repository] findManyByUserId - sortBy: ${sortBy}, sortOrder: ${sortOrder}, Final OrderBy:`, JSON.stringify(orderBy));

    const [records, total] = await Promise.all([
      this.tx.userArtifact.findMany({
        where,
        include: { artifact: true },
        skip,
        take,
        orderBy,
      }),
      this.tx.userArtifact.count({
        where,
      }),
    ]);

    return [
      records.map(r => this.mapper.toEntity(r)),
      total,
    ];
  }

  /**
   * 특정 유물 보유 내역 조회
   */
  async findById(id: bigint): Promise<UserArtifact | null> {
    const record = await this.tx.userArtifact.findUnique({
      where: { id },
      include: { artifact: true },
    });
    if (!record) return null;
    return this.mapper.toEntity(record);
  }

  /**
   * 유저의 특정 슬롯에 장착된 유물 조회
   */
  async findBySlot(userId: bigint, slotNo: number): Promise<UserArtifact | null> {
    const record = await this.tx.userArtifact.findFirst({
      where: {
        userId,
        slotNo,
      },
      include: { artifact: true },
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
