import { Controller, Get, Post, Param, Inject, Req } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiCookieAuth, ApiBearerAuth } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { AssignSupportTicketService } from '../../application/assign-support-ticket.service';
import { CloseSupportTicketService } from '../../application/close-support-ticket.service';
import { SupportTicketAdminResponseDto } from './dto/response/support-ticket-admin.response.dto';
import { SUPPORT_TICKET_REPOSITORY_PORT, type SupportTicketRepositoryPort } from '../../ports/support-ticket.repository.port';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';

@Controller('admin/chat/support')
@ApiTags('Admin Chat Support')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiCookieAuth()
@ApiBearerAuth()
@ApiStandardErrors()
export class SupportAdminController {
    constructor(
        private readonly assignTicketService: AssignSupportTicketService,
        private readonly closeTicketService: CloseSupportTicketService,
        @Inject(SUPPORT_TICKET_REPOSITORY_PORT)
        private readonly ticketRepository: SupportTicketRepositoryPort,
    ) { }

    @Post('tickets/:id/assign')
    @ApiOperation({ summary: 'Assign Support Ticket / 상담 티켓 배정' })
    @ApiStandardResponse(SupportTicketAdminResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'ASSIGN_SUPPORT_TICKET',
        category: 'CHAT',
        extractMetadata: (req) => ({
            id: req.params.id,
            adminId: req.__audit_after?.adminId,
        }),
    })
    async assign(
        @Param('id') id: string,
        @CurrentUser() admin: AuthenticatedUser,
        @Req() req: any,
    ): Promise<SupportTicketAdminResponseDto> {
        const ticket = await this.assignTicketService.execute({
            ticketId: BigInt(id),
            adminId: admin.id,
        });

        const response = new SupportTicketAdminResponseDto({
            id: ticket.id.toString(),
            userId: ticket.userId.toString(),
            adminId: ticket.adminId?.toString() ?? null,
            category: ticket.category,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            roomId: ticket.roomId.toString(),
            closedAt: ticket.closedAt,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
        });

        req.__audit_after = response;

        return response;
    }

    @Post('tickets/:id/close')
    @ApiOperation({ summary: 'Close Support Ticket / 상담 티켓 종료' })
    @ApiStandardResponse(SupportTicketAdminResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'CLOSE_SUPPORT_TICKET',
        category: 'CHAT',
        extractMetadata: (req) => ({
            id: req.params.id,
        }),
    })
    async close(
        @Param('id') id: string,
        @Req() req: any,
    ): Promise<SupportTicketAdminResponseDto> {
        const ticket = await this.closeTicketService.execute({
            ticketId: BigInt(id),
        });

        const response = new SupportTicketAdminResponseDto({
            id: ticket.id.toString(),
            userId: ticket.userId.toString(),
            adminId: ticket.adminId?.toString() ?? null,
            category: ticket.category,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            roomId: ticket.roomId.toString(),
            closedAt: ticket.closedAt,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
        });

        req.__audit_after = response;

        return response;
    }

    @Get('tickets/:id')
    @ApiOperation({ summary: 'Get Support Ticket Detail / 상담 티켓 상세 조회' })
    @ApiStandardResponse(SupportTicketAdminResponseDto)
    async getDetail(@Param('id') id: string): Promise<SupportTicketAdminResponseDto | null> {
        const ticket = await this.ticketRepository.findById(BigInt(id));
        if (!ticket) return null;

        return new SupportTicketAdminResponseDto({
            id: ticket.id.toString(),
            userId: ticket.userId.toString(),
            adminId: ticket.adminId?.toString() ?? null,
            category: ticket.category,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            roomId: ticket.roomId.toString(),
            closedAt: ticket.closedAt,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
        });
    }
}
