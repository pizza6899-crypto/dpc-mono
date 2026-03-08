import { SupportTicket } from '../domain/entities/support-ticket.entity';
import { SupportStatus } from '@prisma/client';

export const SUPPORT_TICKET_REPOSITORY_PORT = Symbol('SUPPORT_TICKET_REPOSITORY_PORT');

export interface SupportTicketRepositoryPort {
    save(ticket: SupportTicket): Promise<SupportTicket>;
    findById(id: bigint): Promise<SupportTicket | null>;
    findByUserId(userId: bigint, status?: SupportStatus): Promise<SupportTicket[]>;
    findActiveTicketByUserId(userId: bigint): Promise<SupportTicket | null>;
}
