import { Module } from '@nestjs/common';
import { SupportUserController } from './controllers/user/support-user.controller';
import { SupportAdminController } from './controllers/admin/support-admin.controller';
import { StartSupportInquiryService } from './application/start-support-inquiry.service';
import { SendSupportMessageService } from './application/send-support-message.service';
import { ListSupportInquiriesService } from './application/list-support-inquiries.service';

import { ChatRoomsModule } from '../rooms/chat-rooms.module';


import { SqidsModule } from 'src/common/sqids/sqids.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { UserProfileModule } from '../../user/profile/user-profile.module';
import { AlertModule } from 'src/modules/notification/alert/alert.module';
import { SupportInquiryPolicy } from './domain/support-inquiry.policy';

@Module({
    imports: [
        ChatRoomsModule,
        SqidsModule,
        ConcurrencyModule,
        UserProfileModule,
        AlertModule,
    ],
    controllers: [
        SupportUserController,
        SupportAdminController,
    ],
    providers: [
        SupportInquiryPolicy,
        StartSupportInquiryService,
        SendSupportMessageService,
        ListSupportInquiriesService,
    ],



    exports: [
        StartSupportInquiryService,
        SendSupportMessageService,
        ListSupportInquiriesService,
    ],



})

export class ChatSupportModule { }
