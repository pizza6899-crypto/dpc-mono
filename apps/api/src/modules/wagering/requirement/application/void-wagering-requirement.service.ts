import { Inject, Injectable, Logger } from '@nestjs/common';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { Transactional } from '@nestjs-cls/transactional';
import {
  WageringRequirementNotFoundException,
  WageringRequirement,
} from '../domain';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface VoidWageringRequirementCommand {
  id: bigint;
  reason?: string;
  adminUserId: bigint;
}

@Injectable()
export class VoidWageringRequirementService {
  private readonly logger = new Logger(VoidWageringRequirementService.name);

  constructor(
    @Inject(WAGERING_REQUIREMENT_REPOSITORY)
    private readonly repository: WageringRequirementRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  @Transactional()
  async execute(
    command: VoidWageringRequirementCommand,
  ): Promise<WageringRequirement> {
    const { id, reason, adminUserId } = command;

    this.logger.log(
      `Voiding wagering requirement ${id} by admin ${adminUserId}`,
    );

    const requirement = await this.repository.findById(id);
    if (!requirement) {
      throw new WageringRequirementNotFoundException();
    }

    // 도메인 로직: 무효화 상태로 변경
    requirement.void(reason);

    // 변경사항 저장
    const updated = await this.repository.save(requirement);

    // 감사 로그 기록
    await this.dispatchLogService.dispatch({
      type: LogType.ACTIVITY,
      data: {
        userId: requirement.userId.toString(),
        category: 'WAGERING',
        action: 'VOID_WAGERING_REQUIREMENT',
        metadata: {
          wageringId: id.toString(),
          reason,
          adminUserId: adminUserId.toString(),
        },
      },
    });

    return updated;
  }
}
