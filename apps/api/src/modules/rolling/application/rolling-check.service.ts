// src/modules/rolling/application/rolling-check.service.ts
import { Injectable, HttpStatus } from '@nestjs/common';
import { RollingService } from './rolling.service';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types/message-codes';

@Injectable()
export class RollingCheckService {
  constructor(private readonly rollingService: RollingService) {}

  /**
   * 출금 전 롤링 체크
   * @throws ApiException 롤링 미완료 시
   */
  async validateWithdrawal(userId: bigint): Promise<void> {
    const canWithdraw = await this.rollingService.canWithdraw(userId);

    if (!canWithdraw) {
      const summary = await this.rollingService.getRollingSummary(userId);
      throw new ApiException(
        MessageCode.ROLLING_NOT_COMPLETED,
        HttpStatus.BAD_REQUEST,
        'You must complete all rolling requirements before withdrawal.',
      );
    }
  }
}
