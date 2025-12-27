// src/modules/affiliate/code/code.module.ts
import { Module } from '@nestjs/common';
import { CreateCodeService } from './application/create-code.service';
import { FindCodesService } from './application/find-codes.service';
import { FindCodeByIdService } from './application/find-code-by-id.service';
import { FindCodeByCodeService } from './application/find-code-by-code.service';
import { UpdateCodeService } from './application/update-code.service';
import { DeleteCodeService } from './application/delete-code.service';
import { ToggleCodeActiveService } from './application/toggle-code-active.service';
import { SetCodeAsDefaultService } from './application/set-code-as-default.service';
import { IncrementCodeUsageService } from './application/increment-code-usage.service';
import { ValidateCodeFormatService } from './application/validate-code-format.service';
import { AffiliateCodePolicy } from './domain';
import { AFFILIATE_CODE_REPOSITORY } from './ports/out/affiliate-code.repository.token';
import { AffiliateCodeRepository } from './infrastructure/affiliate-code.repository';
import { AffiliateCodeMapper } from './infrastructure/affiliate-code.mapper';
import { AffiliateCodeController } from './controllers/affiliate-code.controller';
import { ActivityLogModule } from 'src/platform/activity-log/activity-log.module';

@Module({
  imports: [ActivityLogModule],
  providers: [
    // Use Case Services
    CreateCodeService,
    FindCodesService,
    FindCodeByIdService,
    FindCodeByCodeService,
    UpdateCodeService,
    DeleteCodeService,
    ToggleCodeActiveService,
    SetCodeAsDefaultService,
    IncrementCodeUsageService,
    ValidateCodeFormatService,
    // Domain Policy
    AffiliateCodePolicy,
    // Infrastructure
    AffiliateCodeMapper,
    // Repository (Outbound Port 구현)
    {
      provide: AFFILIATE_CODE_REPOSITORY,
      useClass: AffiliateCodeRepository,
    },
  ],
  controllers: [AffiliateCodeController],
  exports: [
    // Use Case Services (다른 모듈에서 사용 가능)
    CreateCodeService,
    FindCodesService,
    FindCodeByIdService,
    FindCodeByCodeService,
    UpdateCodeService,
    DeleteCodeService,
    ToggleCodeActiveService,
    SetCodeAsDefaultService,
    IncrementCodeUsageService,
    ValidateCodeFormatService,
  ],
})
export class AffiliateCodeModule {}
