import { RewardType, ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { QuestRewardValue } from './quest.interface';

export interface QuestRewardProps {
  id: bigint;
  questMasterId: bigint;
  type: RewardType;
  currency: ExchangeCurrencyCode | null;
  value: QuestRewardValue;
  expireDays: number | null;
  wageringMultiplier: Prisma.Decimal;
}

/**
 * 퀘스트 완료 시 지급될 보상을 정의하는 엔티티입니다.
 */
export class QuestReward {
  private constructor(private readonly props: QuestRewardProps) { }

  static fromPersistence(props: QuestRewardProps): QuestReward {
    return new QuestReward(props);
  }

  static create(params: {
    type: RewardType;
    currency?: ExchangeCurrencyCode | null;
    value?: QuestRewardValue;
    expireDays?: number | null;
    wageringMultiplier?: number | Prisma.Decimal;
  }): QuestReward {
    return new QuestReward({
      id: 0n,
      questMasterId: 0n,
      type: params.type,
      currency: params.currency ?? null,
      value: params.value ?? {},
      expireDays: params.expireDays ?? null,
      wageringMultiplier: new Prisma.Decimal(params.wageringMultiplier?.toString() ?? '0'),
    });
  }

  get id(): bigint { return this.props.id; }
  get questMasterId(): bigint { return this.props.questMasterId; }
  get type(): RewardType { return this.props.type; }
  get currency(): ExchangeCurrencyCode | null { return this.props.currency; }
  get value(): QuestRewardValue { return this.props.value; }
  get expireDays(): number | null { return this.props.expireDays; }
  get wageringMultiplier(): Prisma.Decimal { return this.props.wageringMultiplier; }
}
