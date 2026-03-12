import { UserQuestStatus, ExchangeCurrencyCode } from '@prisma/client';
import { UserQuestProgressData } from './quest.interface';
import { QuestAlreadyClaimedException, QuestNotCompletedException } from '../quest-core.exception';

export interface UserQuestProps {
  id: bigint;
  userId: bigint;
  questMasterId: bigint;
  sourceId: bigint | null;
  cycleId: string;
  currency: ExchangeCurrencyCode;
  status: UserQuestStatus;
  progressData: UserQuestProgressData;
  completedAt: Date | null;
  claimedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 특정 유저의 퀘스트 참여 상태와 진행도를 관리하는 Aggregate Root 엔티티입니다.
 */
export class UserQuest {
  private constructor(private readonly props: UserQuestProps) { }

  static fromPersistence(props: UserQuestProps): UserQuest {
    return new UserQuest(props);
  }

  /**
   * 새로운 퀘스트 참여를 생성합니다.
   */
  static create(params: {
    userId: bigint;
    questMasterId: bigint;
    currency: ExchangeCurrencyCode;
    sourceId?: bigint | null;
    cycleId?: string;
  }): UserQuest {
    return new UserQuest({
      id: 0n,
      userId: params.userId,
      questMasterId: params.questMasterId,
      sourceId: params.sourceId ?? null,
      cycleId: params.cycleId ?? 'SINGLE',
      currency: params.currency,
      status: 'IN_PROGRESS',
      progressData: {},
      completedAt: null,
      claimedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // --- Getters ---
  get id(): bigint { return this.props.id; }
  get userId(): bigint { return this.props.userId; }
  get questMasterId(): bigint { return this.props.questMasterId; }
  get status(): UserQuestStatus { return this.props.status; }
  get cycleId(): string { return this.props.cycleId; }
  get currency(): ExchangeCurrencyCode { return this.props.currency; }
  get progressData(): UserQuestProgressData { return this.props.progressData; }
  get completedAt(): Date | null { return this.props.completedAt; }
  get claimedAt(): Date | null { return this.props.claimedAt; }

  // --- Business Logic ---
  /**
   * 퀘스트 진행도를 업데이트하고 완료 여부를 체크합니다.
   */
  updateProgress(newData: UserQuestProgressData, isCompleted: boolean): void {
    if (this.props.status !== 'IN_PROGRESS') return;

    this.props.progressData = newData;
    if (isCompleted) {
      this.props.status = 'COMPLETED';
      this.props.completedAt = new Date();
    }
  }

  /**
   * 보상 수령 처리를 수행합니다.
   */
  markAsClaimed(): void {
    if (this.props.status === 'CLAIMED') {
      throw new QuestAlreadyClaimedException();
    }
    if (this.props.status !== 'COMPLETED') {
      throw new QuestNotCompletedException(this.props.status);
    }
    this.props.status = 'CLAIMED';
    this.props.claimedAt = new Date();
  }
}
