import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
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

@Module({
    imports: [AuditLogModule],
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
    ],
    exports: [
        CreateWageringRequirementService,
        ProcessWageringContributionService,
        CancelWageringRequirementService,
        FindWageringRequirementsService,
        WAGERING_REQUIREMENT_REPOSITORY
    ],
})
export class WageringModule { }
