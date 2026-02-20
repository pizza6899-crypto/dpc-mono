import { Injectable } from '@nestjs/common';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import {
  TierAuditRepositoryPort,
  CreateTierHistoryProps,
} from '../infrastructure/tier-audit.repository.port';

@Injectable()
export class RecordTierHistoryService {
  constructor(
    private readonly snowflakeService: SnowflakeService,
    private readonly auditRepository: TierAuditRepositoryPort,
  ) {}

  /**
   * 유저의 티어 변경 이력을 기록합니다.
   */
  async execute(
    props: Omit<CreateTierHistoryProps, 'id' | 'changedAt'>,
  ): Promise<void> {
    const { id, timestamp } = this.snowflakeService.generate();
    await this.auditRepository.saveHistory({
      ...props,
      id,
      changedAt: timestamp,
    });
  }
}
