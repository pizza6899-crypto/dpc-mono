import { Module } from '@nestjs/common';
import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { BullModule } from '@nestjs/bullmq';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { UserModule } from 'src/modules/user/user.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { SessionModule } from '../session/session.module';
import { PhoneVerificationController } from './controllers/user/phone-verification.controller';
import { RequestPhoneVerificationService } from './application/request-phone-verification.service';
import { VerifyPhoneService } from './application/verify-phone.service';
import { PHONE_VERIFICATION_REPOSITORY } from './ports/out/phone-verification.repository.token';
import { PhoneVerificationRepository } from './infrastructure/persistence/phone-verification.repository';

@Module({
    imports: [
        UserModule,
        NotificationModule,
        SessionModule,
        BullMqModule,
        BullModule.registerQueue(BULLMQ_QUEUES.NOTIFICATION.ALERT),
    ],
    controllers: [PhoneVerificationController],
    providers: [
        RequestPhoneVerificationService,
        VerifyPhoneService,
        {
            provide: PHONE_VERIFICATION_REPOSITORY,
            useClass: PhoneVerificationRepository,
        },
    ],
    exports: [RequestPhoneVerificationService, VerifyPhoneService],
})
export class PhoneVerificationModule { }
