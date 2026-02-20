// src/modules/affiliate/code/code.module.ts
import { Module } from '@nestjs/common';
import { CreateCodeService } from './application/create-code.service';
import { FindCodesService } from './application/find-codes.service';
import { FindCodeByCodeService } from './application/find-code-by-code.service';
import { FindDefaultCodeService } from './application/find-default-code.service';
import { UpdateCodeService } from './application/update-code.service';
import { IncrementCodeUsageService } from './application/increment-code-usage.service';
import { ValidateCodeFormatService } from './application/validate-code-format.service';
import { FindCodesAdminService } from './application/find-codes-admin.service';
import { FindCodeByIdAdminService } from './application/find-code-by-id-admin.service';
import { DeleteCodeAdminService } from './application/delete-code-admin.service';
import { AffiliateCodePolicy } from './domain';
import { AFFILIATE_CODE_REPOSITORY } from './ports/out/affiliate-code.repository.token';
import { AffiliateCodeRepository } from './infrastructure/affiliate-code.repository';
import { AffiliateCodeMapper } from './infrastructure/affiliate-code.mapper';
import { AffiliateCodeController } from './controllers/user/affiliate-code.controller';
import { AffiliateCodeAdminController } from './controllers/admin/affiliate-code-admin.controller';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';

@Module({
  imports: [ConcurrencyModule],
  providers: [
    // Use Case Services
    CreateCodeService,
    FindCodesService,
    FindCodeByCodeService,
    FindDefaultCodeService,
    UpdateCodeService,
    IncrementCodeUsageService,
    ValidateCodeFormatService,

    FindCodesAdminService,
    FindCodeByIdAdminService,
    DeleteCodeAdminService,
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
  controllers: [AffiliateCodeController, AffiliateCodeAdminController],
  exports: [
    // Use Case Services (다른 모듈에서 사용 가능)
    CreateCodeService,
    FindCodesService,
    FindCodeByCodeService,
    FindDefaultCodeService,
    UpdateCodeService,
    IncrementCodeUsageService,
    ValidateCodeFormatService,
    FindCodesAdminService,
  ],
})
export class AffiliateCodeModule {}
