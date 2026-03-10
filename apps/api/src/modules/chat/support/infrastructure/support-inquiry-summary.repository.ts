import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { SupportStatus, SupportPriority, SupportCategory } from '@prisma/client';
import { SupportInquirySummary } from '../domain/support-inquiry-summary';
import { type SupportInquirySummaryRepositoryPort } from '../ports/support-inquiry-summary.repository.port';
import { SupportInquiryMapper } from './support-inquiry.mapper';

@Injectable()
export class SupportInquirySummaryRepository implements SupportInquirySummaryRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async list(filters: {
        status?: SupportStatus;
        priority?: SupportPriority;
        category?: SupportCategory;
        adminId?: bigint;
        currentAdminId?: bigint;
        roomId?: bigint;
    }): Promise<SupportInquirySummary[]> {
        const records = await this.tx.chatRoom.findMany({
            where: {
                type: 'SUPPORT',
                supportStatus: filters.status ?? {
                    in: [
                        SupportStatus.OPEN,
                        SupportStatus.IN_PROGRESS,
                        SupportStatus.PENDING,
                    ],
                },
                supportPriority: filters.priority,
                supportCategory: filters.category,
                supportAdminId: filters.adminId,
                id: filters.roomId,
            },
            include: {
                members: {
                    include: {
                        user: true
                    }
                },
                messages: {
                    where: { isDeleted: false },
                    orderBy: {
                        id: 'desc'
                    },
                    take: 1
                },
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { updatedAt: 'desc' },
        });

        return records.map((record) => SupportInquiryMapper.toSummary(record));
    }
}
