import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { CreateSupportTicketService } from '../../application/create-support-ticket.service';
import { CreateSupportTicketRequestDto } from './dto/request/create-support-ticket.request.dto';
import { SupportTicketUserResponseDto } from './dto/response/support-ticket-user.response.dto';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

@Controller('chat/support')
@ApiTags('User Chat Support')
@ApiCookieAuth()
@ApiStandardErrors()
export class SupportUserController {
    constructor(
        private readonly createTicketService: CreateSupportTicketService,
        private readonly sqidsService: SqidsService,
    ) { }


    @Post('tickets')
    @ApiOperation({ summary: 'Create or Get Support Ticket / 고객 문의 티켓 생성 또는 조회' })
    @ApiStandardResponse(SupportTicketUserResponseDto)
    async create(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateSupportTicketRequestDto,
    ): Promise<SupportTicketUserResponseDto> {
        const ticket = await this.createTicketService.execute({
            userId: user.id,
            ...dto,
        });

        return {
            id: this.sqidsService.encode(ticket.id, SqidsPrefix.CHAT_TICKET),
            category: ticket.category,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            roomId: this.sqidsService.encode(ticket.roomId, SqidsPrefix.CHAT_ROOM),
            createdAt: ticket.createdAt,
        };
    }
}

