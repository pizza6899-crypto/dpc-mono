import { Module } from '@nestjs/common';
import { AuditLogModule } from '../../../modules/audit-log/audit-log.module';
import { WageringRequirementRepository } from './infrastructure/wagering-requirement.repository';
import { WageringContributionLogRepository } from './infrastructure/wagering-contribution-log.repository';
import { WageringRequirementMapper } from './infrastructure/wagering-requirement.mapper';
import {
    CheckWageringRequirementService,
    CreateWageringRequirementService,
    ProcessWageringContributionService,
    CancelWageringRequirementService,
    FindWageringRequirementsService,
    SettleWageringRequirementService,
    VoidWageringRequirementService,
    FindWageringContributionLogsService,
    ForfeitWageringRequirementService
} from './application';
import { WageringPolicy } from './domain';
import { WAGERING_REQUIREMENT_REPOSITORY, WAGERING_CONTRIBUTION_LOG_REPOSITORY } from './ports';
import { WageringRequirementAdminController } from './controllers/admin/wagering-requirement-admin.controller';
import { WageringRequirementUserController } from './controllers/user/wagering-requirement-user.controller';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { WageringConfigModule } from '../config/wagering-config.module';
import { WalletModule } from '../../wallet/wallet.module';

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
        {
            provide: WAGERING_CONTRIBUTION_LOG_REPOSITORY,
            useClass: WageringContributionLogRepository,
        },

        // Application
        CheckWageringRequirementService,
        CreateWageringRequirementService,
        ProcessWageringContributionService,
        CancelWageringRequirementService,
        FindWageringRequirementsService,
        SettleWageringRequirementService,
        VoidWageringRequirementService,
        FindWageringContributionLogsService,
        ForfeitWageringRequirementService,
    ],
    exports: [
        CheckWageringRequirementService,
        CreateWageringRequirementService,
        ProcessWageringContributionService,
        CancelWageringRequirementService,
        FindWageringRequirementsService,
        SettleWageringRequirementService,
        VoidWageringRequirementService,
        FindWageringContributionLogsService,
        ForfeitWageringRequirementService,
        WAGERING_REQUIREMENT_REPOSITORY,
        WAGERING_CONTRIBUTION_LOG_REPOSITORY
    ],
})
export class RequirementModule { }
