// src/modules/affiliate/referral/referral.module.ts
import { Module } from '@nestjs/common';
import { AffiliateCodeModule } from '../code/code.module';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { ReferralPolicy } from './domain';
import { LinkReferralService } from './application/link-referral.service';
import { FindReferralByIdService } from './application/find-referral-by-id.service';
import { FindReferralsByAffiliateIdService } from './application/find-referrals-by-affiliate-id.service';
import { FindReferralBySubUserIdService } from './application/find-referral-by-sub-user-id.service';
import { AdminReferralService } from './application/admin-referral.service';
import { ReferralMapper } from './infrastructure/referral.mapper';
import { ReferralRepository } from './infrastructure/referral.repository';
import { REFERRAL_REPOSITORY } from './ports/out/referral.repository.token';
import { AdminReferralController } from './controllers/admin-referral.controller';

@Module({
  imports: [
    PrismaModule, // PrismaService를 위해 필요
    AffiliateCodeModule, // 레퍼럴 코드 조회를 위해 필요
    ActivityLogModule, // Activity Log를 위해 필요
  ],
  providers: [
    // Domain Policy
    ReferralPolicy,
    // Use Case Services
    LinkReferralService,
    FindReferralByIdService,
    FindReferralsByAffiliateIdService,
    FindReferralBySubUserIdService,
    // Admin Services
    AdminReferralService,
    // Infrastructure
    ReferralMapper,
    // Repository (Outbound Port 구현)
    {
      provide: REFERRAL_REPOSITORY,
      useClass: ReferralRepository,
    },
  ],
  controllers: [
    AdminReferralController,
    // ReferralController (추후 추가 예정)
  ],
  exports: [
    // Use Case Services (다른 모듈에서 사용 가능)
    LinkReferralService, // auth 모듈에서 사용
    FindReferralByIdService,
    FindReferralsByAffiliateIdService,
    FindReferralBySubUserIdService,
  ],
})
export class AffiliateReferralModule {}
