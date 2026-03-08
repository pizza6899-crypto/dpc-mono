import { SupportTicket as PrismaSupportTicket } from '@prisma/client';
import { SupportTicket } from '../domain/entities/support-ticket.entity';

export class SupportTicketMapper {
    static toDomain(raw: PrismaSupportTicket): SupportTicket {
        return SupportTicket.fromPersistence({
            id: raw.id,
            userId: raw.userId,
            adminId: raw.adminId,
            roomId: raw.roomId,
            category: raw.category,
            subject: raw.subject,
            status: raw.status,
            priority: raw.priority,
            closedAt: raw.closedAt,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }

    static toPersistence(domain: SupportTicket): Partial<PrismaSupportTicket> {
        return {
            id: domain.id === 0n ? undefined : domain.id,
            userId: domain.userId,
            adminId: domain.adminId,
            roomId: domain.roomId,
            category: domain.category,
            subject: domain.subject,
            status: domain.status,
            priority: domain.priority,
            closedAt: domain.closedAt,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }
}
