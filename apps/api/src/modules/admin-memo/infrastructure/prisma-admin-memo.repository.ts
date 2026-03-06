import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { AdminMemo } from '../domain';
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
        const record = await this.tx.adminMemo.create({
            data: {
                adminId: params.adminId,
                content: params.content,
                depositId: params.depositId,
            },
            include: this._includeAdmin,
        });

        return this.mapper.toDomain(record as any);
    }

    async findByDepositId(depositId: bigint, limit = 50): Promise<AdminMemo[]> {
        const records = await this.tx.adminMemo.findMany({
            where: { depositId },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: this._includeAdmin,
        });

        return records.map(record => this.mapper.toDomain(record as any));
    }
}
