import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { SUPPORT_TICKET_REPOSITORY_PORT, type SupportTicketRepositoryPort } from '../ports/support-ticket.repository.port';
import { SupportTicket } from '../domain/entities/support-ticket.entity';
import { SupportTicketNotFoundException } from '../domain/support.exception';

export interface CloseSupportTicketParams {
    ticketId: bigint;
}

@Injectable()
export class CloseSupportTicketService {
    constructor(
        @Inject(SUPPORT_TICKET_REPOSITORY_PORT)
        private readonly ticketRepository: SupportTicketRepositoryPort,
    ) { }

    @Transactional()
    async execute(params: CloseSupportTicketParams): Promise<SupportTicket> {
        const ticket = await this.ticketRepository.findById(params.ticketId);
        if (!ticket) {
            throw new SupportTicketNotFoundException();
        }

        ticket.close();

        return await this.ticketRepository.save(ticket);
    }
}
