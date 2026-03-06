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
    ) { }

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

    async findByTarget(type: AdminMemoTargetType, targetId: bigint, limit = 50): Promise<AdminMemo[]> {
        const where: any = {};
        if (type === 'DEPOSIT') where.depositId = targetId;
        else if (type === 'USER') where.userId = targetId;

        const records = await this.tx.adminMemo.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: this._includeAdmin,
        });

        return records.map(record => this.mapper.toDomain(record as any));
    }
}
