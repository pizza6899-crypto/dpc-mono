import { Module } from '@nestjs/common';
import { SupportUserController } from './controllers/user/support-user.controller';
import { SupportAdminController } from './controllers/admin/support-admin.controller';
import { StartSupportInquiryService } from './application/start-support-inquiry.service';
import { SendSupportMessageService } from './application/send-support-message.service';
import { ListSupportInquiriesService } from './application/list-support-inquiries.service';
import { UpdateSupportInquiryService } from './application/update-support-inquiry.service';
import { CloseSupportInquiryService } from './application/close-support-inquiry.service';

import { ChatRoomsModule } from '../rooms/chat-rooms.module';


import { SqidsModule } from 'src/common/sqids/sqids.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { UserProfileModule } from '../../user/profile/user-profile.module';
import { AlertModule } from 'src/modules/notification/alert/alert.module';
import { SupportInquiryPolicy } from './domain/support-inquiry.policy';
import { SUPPORT_INQUIRY_SUMMARY_REPOSITORY_PORT } from './ports/support-inquiry-summary.repository.port';
import { SupportInquirySummaryRepository } from './infrastructure/support-inquiry-summary.repository';

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
        UpdateSupportInquiryService,
        CloseSupportInquiryService,
        {
            provide: SUPPORT_INQUIRY_SUMMARY_REPOSITORY_PORT,
            useClass: SupportInquirySummaryRepository,
        }
    ],



    exports: [
        StartSupportInquiryService,
        SendSupportMessageService,
        ListSupportInquiriesService,
        UpdateSupportInquiryService,
        CloseSupportInquiryService,
    ],



})

export class ChatSupportModule { }
