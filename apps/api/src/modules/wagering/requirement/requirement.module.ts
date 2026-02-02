import { Module } from '@nestjs/common';
import { AuditLogModule } from '../../../modules/audit-log/audit-log.module';
import { WageringRequirementRepository } from './infrastructure/wagering-requirement.repository';
import { WageringRequirementMapper } from './infrastructure/wagering-requirement.mapper';
import {
    CreateWageringRequirementService,
    ProcessWageringContributionService,
    CancelWageringRequirementService,
    FindWageringRequirementsService
} from './application';
import { WageringPolicy } from './domain';
import { WAGERING_REQUIREMENT_REPOSITORY } from './ports';
import { WageringRequirementAdminController } from './controllers/admin/wagering-requirement-admin.controller';
import { WageringRequirementUserController } from './controllers/user/wagering-requirement-user.controller';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { WageringConfigModule } from '../config/wagering-config.module';
import { WalletModule } from '../../wallet/wallet.module';
import { SettleWageringRequirementService } from './application/settle-wagering-requirement.service';

@Module({
    imports: [AuditLogModule, SnowflakeModule, WageringConfigModule, WalletModule],
    controllers: [
        WageringRequirementAdminController,
        WageringRequirementUserController
    ],
    providers: [
        // Domain
        WageringPolicy,

        // Infrastructure
        WageringRequirementMapper,
        {
            provide: WAGERING_REQUIREMENT_REPOSITORY,
            useClass: WageringRequirementRepository,
        },

        // Application
        CreateWageringRequirementService,
        ProcessWageringContributionService,
        CancelWageringRequirementService,
        FindWageringRequirementsService,
        SettleWageringRequirementService,
    ],
    exports: [
        CreateWageringRequirementService,
        ProcessWageringContributionService,
        CancelWageringRequirementService,
        FindWageringRequirementsService,
        SettleWageringRequirementService,
        WAGERING_REQUIREMENT_REPOSITORY
    ],
})
export class RequirementModule { }
