import { Module, forwardRef } from '@nestjs/common';
import { CreateSupportTicketService } from './application/create-support-ticket.service';
import { AssignSupportTicketService } from './application/assign-support-ticket.service';
import { CloseSupportTicketService } from './application/close-support-ticket.service';
import { SUPPORT_TICKET_REPOSITORY_PORT } from './ports/support-ticket.repository.port';
import { SupportTicketRepository } from './infrastructure/support-ticket.repository';
import { SupportUserController } from './controllers/user/support-user.controller';
import { SupportAdminController } from './controllers/admin/support-admin.controller';
import { ChatRoomsModule } from '../rooms/chat-rooms.module';
import { SqidsModule } from 'src/common/sqids/sqids.module';

@Module({
    imports: [
        ChatRoomsModule,
        SqidsModule,
    ],
    controllers: [
        SupportUserController,
        SupportAdminController,
    ],
    providers: [
        {
            provide: SUPPORT_TICKET_REPOSITORY_PORT,
            useClass: SupportTicketRepository,
        },
        CreateSupportTicketService,
        AssignSupportTicketService,
        CloseSupportTicketService,
    ],
    exports: [
        SUPPORT_TICKET_REPOSITORY_PORT,
    ],
})
export class ChatSupportModule { }
