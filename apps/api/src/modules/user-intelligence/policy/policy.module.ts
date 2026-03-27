import { Module } from '@nestjs/common';
import { GetActivePolicyService } from './application/get-active-policy.service';
import { ApplyNewPolicyService } from './application/apply-new-policy.service';
import { PrismaPolicyRepository } from './infrastructure/prisma-policy.repository';
import { POLICY_REPOSITORY_PORT } from './ports/policy-repository.port';

@Module({
  providers: [
    GetActivePolicyService,
    ApplyNewPolicyService,
    {
      provide: POLICY_REPOSITORY_PORT,
      useClass: PrismaPolicyRepository,
    },
  ],
  exports: [GetActivePolicyService, ApplyNewPolicyService],
})
export class PolicyModule { }
