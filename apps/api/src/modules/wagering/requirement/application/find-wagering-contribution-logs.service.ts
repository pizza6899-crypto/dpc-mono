import { Inject, Injectable } from '@nestjs/common';
import { WAGERING_CONTRIBUTION_LOG_REPOSITORY } from '../ports';
import type { WageringContributionLogRepositoryPort } from '../ports';
import { WageringContributionLog } from '../domain';

@Injectable()
export class FindWageringContributionLogsService {
  constructor(
    @Inject(WAGERING_CONTRIBUTION_LOG_REPOSITORY)
    private readonly repository: WageringContributionLogRepositoryPort,
  ) {}

  async execute(
    wageringRequirementId: bigint,
  ): Promise<WageringContributionLog[]> {
    return await this.repository.findByRequirementId(wageringRequirementId);
  }
}
