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

  /**
   * 관리자 차감/조정 가능 여부를 검증합니다.
   */
  verifyAdminAdjust(account: CompAccount): void {
    // 관리자 기능이므로 어뷰징 동결 유저라도 조정이 필요할 수 있습니다.
    // 만약 정책상 무조건 막아야 한다면 여기서 isFrozen을 체크합니다.
    // 현재는 관리자는 동결 상태를 무시하고 조정 가능하도록 허용합니다. (필요 시 수정)
  }
}
