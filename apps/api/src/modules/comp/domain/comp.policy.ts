import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CompConfig } from './model/comp-config.entity';
import { CompAccount } from './model/comp-account.entity';
import { CompPolicyViolationException } from './comp.exception';

@Injectable()
export class CompPolicy {
  /**
   * 적립 가능 여부를 검증합니다.
   */
  verifyEarn(config: CompConfig | null): void {
    if (!config) return;

    if (!config.canEarn()) {
      throw new CompPolicyViolationException(
        `Comp earn is currently disabled by system policy.`,
      );
    }
  }

  /**
   * 콤프 자동 정산(Settlement) 가능 여부를 검증합니다.
   */
  verifySettlement(
    config: CompConfig | null,
    account: CompAccount,
    amount: Prisma.Decimal,
  ): void {
    if (account.isFrozen) {
      throw new CompPolicyViolationException(
        `Comp account is frozen. Settlement denied.`,
      );
    }

    if (config) {
      if (!config.isSettlementEnabled) {
        throw new CompPolicyViolationException(
          `Comp settlement is currently disabled by system policy.`,
        );
      }

      if (amount.lessThan(config.minSettlementAmount)) {
        throw new CompPolicyViolationException(
          `Settlement amount (${amount}) is less than minimum allowed amount (${config.minSettlementAmount}).`,
        );
      }
    }
  }
}
