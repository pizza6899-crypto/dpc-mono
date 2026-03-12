import { RewardType, ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { UserRewardHistoryDetail } from './quest.interface';

export interface UserRewardHistoryProps {
  id: bigint;
  userQuestId: bigint;
  userId: bigint;
  type: RewardType;
  amount: Prisma.Decimal | null;
  currency: ExchangeCurrencyCode | null;
  detail: UserRewardHistoryDetail;
  wageringId: bigint | null;
}

/**
 * 유저가 퀘스트 보상을 지급받은 이력을 관리하는 엔티티입니다.
 */
export class UserRewardHistory {
  private constructor(private readonly props: UserRewardHistoryProps) { }

  static fromPersistence(props: UserRewardHistoryProps): UserRewardHistory {
    return new UserRewardHistory(props);
  }

  static create(params: Omit<UserRewardHistoryProps, 'id'>): UserRewardHistory {
    return new UserRewardHistory({
      ...params,
      id: 0n,
    });
  }

  get id(): bigint { return this.props.id; }
  get userQuestId(): bigint { return this.props.userQuestId; }
  get userId(): bigint { return this.props.userId; }
  get type(): RewardType { return this.props.type; }
  get amount(): Prisma.Decimal | null { return this.props.amount; }
  get currency(): ExchangeCurrencyCode | null { return this.props.currency; }
  get detail(): UserRewardHistoryDetail { return this.props.detail; }
  get wageringId(): bigint | null { return this.props.wageringId; }
}
