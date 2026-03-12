import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { QuestMatchRule } from './quest.interface';

export interface QuestGoalProps {
  id: bigint;
  questMasterId: bigint;
  currency: ExchangeCurrencyCode | null;
  targetAmount: Prisma.Decimal | null;
  targetCount: number | null;
  matchRule: QuestMatchRule;
}

/**
 * 퀘스트 완료를 위한 목표 조건을 관리하는 엔티티입니다.
 */
export class QuestGoal {
  private constructor(private readonly props: QuestGoalProps) { }

  static fromPersistence(props: QuestGoalProps): QuestGoal {
    return new QuestGoal(props);
  }

  static create(params: {
    currency?: ExchangeCurrencyCode | null;
    targetAmount?: number | Prisma.Decimal | null;
    targetCount?: number | null;
    matchRule?: QuestMatchRule;
  }): QuestGoal {
    return new QuestGoal({
      id: 0n,
      questMasterId: 0n,
      currency: params.currency ?? null,
      targetAmount: params.targetAmount ? new Prisma.Decimal(params.targetAmount.toString()) : null,
      targetCount: params.targetCount ?? null,
      matchRule: params.matchRule ?? {},
    });
  }

  get id(): bigint { return this.props.id; }
  get questMasterId(): bigint { return this.props.questMasterId; }
  get currency(): ExchangeCurrencyCode | null { return this.props.currency; }
  get targetAmount(): Prisma.Decimal | null { return this.props.targetAmount; }
  get targetCount(): number | null { return this.props.targetCount; }
  get matchRule(): QuestMatchRule { return this.props.matchRule; }

  /**
   * 주어진 수치가 목표치를 달성했는지 확인합니다.
   */
  isSatisfied(count: number, amount: number): boolean {
    // 횟수 조건이 있는 경우 체크 (targetCount가 1 이상인 경우에만 의미 있음)
    if (this.props.targetCount !== null && count < this.props.targetCount) {
      return false;
    }

    // 금액 조건이 있는 경우 체크
    if (this.props.targetAmount !== null) {
      const target = Number(this.props.targetAmount);
      if (amount < target) {
        return false;
      }
    }

    // 조건이 설정되어 있지 않다면 만족한 것으로 간주 (혹은 최소 1회 참여 등으로 해석)
    return true;
  }
}
