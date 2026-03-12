import { QuestType, QuestCategory, ResetCycle, ExchangeCurrencyCode, RewardType, Prisma } from '@prisma/client';
import { QuestMetadata, QuestEntryRule, QuestMatchRule, QuestRewardValue } from './quest.interface';
import { QuestGoal } from './quest-goal.entity';
import { QuestReward } from './quest-reward.entity';
import { QuestTranslation } from './quest-translation.entity';

export interface QuestMasterProps {
  id: bigint;
  type: QuestType;
  category: QuestCategory;
  resetCycle: ResetCycle;
  maxAttempts: number | null;
  isActive: boolean;
  parentId: bigint | null;
  precedingId: bigint | null;
  metadata: QuestMetadata;
  entryRule: QuestEntryRule;
  updatedBy: bigint | null;
  startTime: Date | null;
  endTime: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  goals?: QuestGoal[];
  rewards?: QuestReward[];
  translations?: QuestTranslation[];
}

/**
 * 퀘스트의 기본 정의와 설정을 관리하는 엔티티입니다.
 */
export class QuestMaster {
  private constructor(private readonly props: QuestMasterProps) { }

  static fromPersistence(props: QuestMasterProps): QuestMaster {
    return new QuestMaster(props);
  }

  static create(params: {
    type: QuestType;
    category: QuestCategory;
    resetCycle?: ResetCycle;
    metadata?: QuestMetadata;
    entryRule?: QuestEntryRule;
    startTime?: Date | null;
    endTime?: Date | null;
    updatedBy?: bigint | null;
    goals?: QuestGoal[];
    rewards?: QuestReward[];
    translations?: QuestTranslation[];
  }): QuestMaster {
    return new QuestMaster({
      id: 0n,
      type: params.type,
      category: params.category,
      resetCycle: params.resetCycle ?? 'NONE',
      maxAttempts: null,
      isActive: true,
      parentId: null,
      precedingId: null,
      metadata: params.metadata ?? {},
      entryRule: params.entryRule ?? {},
      updatedBy: params.updatedBy ?? null,
      startTime: params.startTime ?? null,
      endTime: params.endTime ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      goals: params.goals ?? [],
      rewards: params.rewards ?? [],
      translations: params.translations ?? [],
    });
  }

  // --- Getters ---
  get id(): bigint { return this.props.id; }
  get type(): QuestType { return this.props.type; }
  get category(): QuestCategory { return this.props.category; }
  get resetCycle(): ResetCycle { return this.props.resetCycle; }
  get maxAttempts(): number | null { return this.props.maxAttempts; }
  get isActive(): boolean { return this.props.isActive; }
  get parentId(): bigint | null { return this.props.parentId; }
  get precedingId(): bigint | null { return this.props.precedingId; }
  get metadata(): QuestMetadata { return this.props.metadata; }
  get entryRule(): QuestEntryRule { return this.props.entryRule; }
  get updatedBy(): bigint | null { return this.props.updatedBy; }
  get startTime(): Date | null { return this.props.startTime; }
  get endTime(): Date | null { return this.props.endTime; }
  get goals(): QuestGoal[] { return this.props.goals ?? []; }
  get rewards(): QuestReward[] { return this.props.rewards ?? []; }
  get translations(): QuestTranslation[] { return this.props.translations ?? []; }

  // --- Business Logic ---
  /**
   * 퀘스트가 현재 활성화 및 기간 내에 있는지 확인합니다.
   */
  isAvailable(now: Date = new Date()): boolean {
    if (!this.isActive) return false;
    if (this.props.startTime && now < this.props.startTime) return false;
    if (this.props.endTime && now > this.props.endTime) return false;
    return true;
  }

  /**
   * 해당 통화에 대한 목표 설정을 조회합니다.
   * 통화별 전용 목표가 없으면 공통 목표(currency=null)를 반환합니다.
   */
  getGoal(currency: ExchangeCurrencyCode): QuestGoal | undefined {
    return (
      this.goals.find((g) => g.currency === currency) ??
      this.goals.find((g) => g.currency === null)
    );
  }
}
