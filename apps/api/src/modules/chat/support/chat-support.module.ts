import { Module } from '@nestjs/common';
import { SupportUserController } from './controllers/user/support-user.controller';
import { SupportAdminController } from './controllers/admin/support-admin.controller';
import { StartSupportInquiryService } from './application/start-support-inquiry.service';
import { SendSupportMessageService } from './application/send-support-message.service';
import { GetMySupportInquiryService } from './application/get-my-support-inquiry.service';
import { ListSupportInquiriesService } from './application/list-support-inquiries.service';
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
        StartSupportInquiryService,
        SendSupportMessageService,
        GetMySupportInquiryService,
        ListSupportInquiriesService,
    ],


    exports: [
        StartSupportInquiryService,
        SendSupportMessageService,
        GetMySupportInquiryService,
        ListSupportInquiriesService,
    ],


})

export class ChatSupportModule { }
