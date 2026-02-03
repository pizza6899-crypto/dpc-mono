import { Inject, Injectable } from '@nestjs/common';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { WageringContributionLog } from '../domain';

@Injectable()
export class FindWageringContributionLogsService {
    constructor(
        @Inject(WAGERING_REQUIREMENT_REPOSITORY)
        private readonly repository: WageringRequirementRepositoryPort,
    ) { }

    async execute(wageringRequirementId: bigint): Promise<WageringContributionLog[]> {
        return await this.repository.findLogsByRequirementId(wageringRequirementId);
    }
}
