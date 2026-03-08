import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { SupportTicket } from '../domain/entities/support-ticket.entity';
import { SupportTicketRepositoryPort } from '../ports/support-ticket.repository.port';
import { SupportTicketMapper } from './support-ticket.mapper';
import { SupportStatus } from '@prisma/client';

@Injectable()
export class SupportTicketRepository implements SupportTicketRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async findById(id: bigint): Promise<SupportTicket | null> {
        const record = await this.tx.supportTicket.findUnique({
            where: { id },
        });

        return record ? SupportTicketMapper.toDomain(record) : null;
    }

    async findByUserId(userId: bigint, status?: SupportStatus): Promise<SupportTicket[]> {
        const records = await this.tx.supportTicket.findMany({
            where: { userId, status },
            orderBy: { createdAt: 'desc' },
        });

        return records.map((record) => SupportTicketMapper.toDomain(record));
    }

    async findActiveTicketByUserId(userId: bigint): Promise<SupportTicket | null> {
        const record = await this.tx.supportTicket.findFirst({
            where: {
                userId,
                status: {
                    in: [SupportStatus.OPEN, SupportStatus.IN_PROGRESS, SupportStatus.PENDING],
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return record ? SupportTicketMapper.toDomain(record) : null;
    }

    async save(ticket: SupportTicket): Promise<SupportTicket> {
        const persistenceData = SupportTicketMapper.toPersistence(ticket);

        let record;
        if (ticket.id === 0n) {
            record = await this.tx.supportTicket.create({
                data: persistenceData as any,
            });
        } else {
            record = await this.tx.supportTicket.update({
                where: { id: ticket.id },
                data: persistenceData as any,
            });
        }

        return SupportTicketMapper.toDomain(record);
    }
}
