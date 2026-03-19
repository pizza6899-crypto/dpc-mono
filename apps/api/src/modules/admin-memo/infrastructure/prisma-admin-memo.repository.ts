import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { AdminMemo, AdminMemoTargetType } from '../domain';
import {
  AdminMemoRepositoryPort,
  type CreateAdminMemoParams,
} from '../ports/out';
import { AdminMemoMapper } from './admin-memo.mapper';

@Injectable()
export class PrismaAdminMemoRepository implements AdminMemoRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: AdminMemoMapper,
  ) {}

  private get _includeAdmin() {
    return {
      admin: {
        select: {
          nickname: true,
        },
      },
    };
  }

  async create(params: CreateAdminMemoParams): Promise<AdminMemo> {
    // 엔티티를 통해 비즈니스 규칙 재검증 및 데이터 정제
    const domain = AdminMemo.create(params);
    const data = this.mapper.toPrismaCreate(domain);

    const record = await this.tx.adminMemo.create({
      data,
      include: this._includeAdmin,
    });

    return this.mapper.toDomain(record as any);
  }

  async findByTarget(
    type: AdminMemoTargetType,
    targetId: bigint,
    limit = 50,
  ): Promise<AdminMemo[]> {
    const where: any = {};
    if (type === 'DEPOSIT') where.depositId = targetId;
    else if (type === 'USER') where.userId = targetId;

    const records = await this.tx.adminMemo.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: this._includeAdmin,
    });

    return records.map((record) => this.mapper.toDomain(record as any));
  }

  async findByTargets(
    type: AdminMemoTargetType,
    targetIds: bigint[],
  ): Promise<AdminMemo[]> {
    if (targetIds.length === 0) return [];

    const where: any = {};
    if (type === 'DEPOSIT') where.depositId = { in: targetIds };
    else if (type === 'USER') where.userId = { in: targetIds };

    const records = await this.tx.adminMemo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: this._includeAdmin,
    });

    return records.map((record) => this.mapper.toDomain(record as any));
  }

  async findCountsByTargets(
    type: AdminMemoTargetType,
    targetIds: bigint[],
  ): Promise<Map<bigint, number>> {
    if (targetIds.length === 0) return new Map();

    const field = type === 'DEPOSIT' ? 'depositId' : 'userId';
    const counts = await this.tx.adminMemo.groupBy({
      by: [field as any],
      where: { [field]: { in: targetIds } },
      _count: true,
    });

    const resultMap = new Map<bigint, number>();
    counts.forEach((c: any) => {
      const id = c[field];
      if (id) resultMap.set(id, c._count);
    });
    return resultMap;
  }

  async findLatestByTargets(
    type: AdminMemoTargetType,
    targetIds: bigint[],
  ): Promise<Map<bigint, AdminMemo>> {
    if (targetIds.length === 0) return new Map();

    const field = type === 'DEPOSIT' ? 'depositId' : 'userId';
    const dbField = type === 'DEPOSIT' ? 'deposit_id' : 'user_id';

    // Kysely의 DISTINCT ON을 사용하여 각 ID별로 최신 1건만 단일 쿼리로 조회
    // SQL: SELECT DISTINCT ON (deposit_id/user_id) * FROM admin_memos ... ORDER BY ..., created_at DESC
    const records = await this.tx.$kysely
      .selectFrom('admin_memos as t')
      .leftJoin('users as admin', 't.admin_id', 'admin.id')
      .select([
        't.id',
        't.admin_id as adminId',
        't.content',
        't.created_at as createdAt',
        't.deposit_id as depositId',
        't.user_id as userId',
        'admin.nickname as adminNickname',
      ])
      .distinctOn(`t.${dbField}`)
      .where(
        `t.${dbField}`,
        'in',
        targetIds.map((id) => id.toString()),
      )
      .orderBy(`t.${dbField}`)
      .orderBy('t.created_at', 'desc')
      .execute();

    const resultMap = new Map<bigint, AdminMemo>();
    records.forEach((record: any) => {
      const targetId = BigInt(record[field]);
      if (targetId) {
        // Mapper가 기대하는 구조(admin.nickname)로 변환하여 전달
        const domain = this.mapper.toDomain({
          ...record,
          admin: record.adminNickname
            ? { nickname: record.adminNickname }
            : undefined,
        });
        resultMap.set(targetId, domain);
      }
    });
    return resultMap;
  }
}
