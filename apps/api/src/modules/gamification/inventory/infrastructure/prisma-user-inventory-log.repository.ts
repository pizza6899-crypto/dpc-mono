import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserInventoryLogRepositoryPort, FindInventoryLogsParams } from '../ports/user-inventory-log.repository.port';
import { UserInventoryLog } from '../domain/user-inventory-log.entity';
import { UserInventoryLogMapper } from './user-inventory-log.mapper';
import { Prisma } from '@prisma/client';

/**
 * [Gamification] 인벤토리 로그 리포지토리의 Prisma 구현체
 */
@Injectable()
export class PrismaUserInventoryLogRepository implements UserInventoryLogRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  /**
   * 새로운 로그 삽입
   */
  async insert(log: UserInventoryLog): Promise<void> {
    const data = UserInventoryLogMapper.toPersistence(log);
    await this.tx.userInventoryLog.create({
      data: data,
    });
  }

  /**
   * 고유 ID와 날짜(복합키)로 상세 조회
   */
  async findById(id: bigint, createdAt: Date): Promise<UserInventoryLog | null> {
    const record = await this.tx.userInventoryLog.findUnique({
      where: {
        id_createdAt: { id, createdAt },
      },
    });

    return record ? UserInventoryLogMapper.toDomain(record) : null;
  }

  /**
   * 조건별 로그 목록 조회
   */
  async findMany(params: FindInventoryLogsParams): Promise<UserInventoryLog[]> {
    const where = this._buildWhereClause(params);

    const records = await this.tx.userInventoryLog.findMany({
      where,
      take: params.limit ?? 20,
      skip: params.offset ?? 0,
      orderBy: { createdAt: 'desc' },
    });

    return records.map(UserInventoryLogMapper.toDomain);
  }

  /**
   * 총 건수 조회
   */
  async count(params: FindInventoryLogsParams): Promise<number> {
    return this.tx.userInventoryLog.count({
      where: this._buildWhereClause(params),
    });
  }

  /**
   * 공통 Where 절 빌더
   */
  private _buildWhereClause(params: FindInventoryLogsParams): Prisma.UserInventoryLogWhereInput {
    const where: Prisma.UserInventoryLogWhereInput = {};

    if (params.userId !== undefined) where.userId = params.userId;
    if (params.inventoryId !== undefined) where.inventoryId = params.inventoryId;
    if (params.itemId !== undefined) where.itemId = params.itemId;
    if (params.action !== undefined) where.action = params.action;
    if (params.slot !== undefined) where.slot = params.slot;

    if (params.from !== undefined || params.to !== undefined) {
      where.createdAt = {
        gte: params.from,
        lte: params.to,
      };
    }

    return where;
  }
}
