import { QuestType, ResetCycle, ExchangeCurrencyCode } from '@prisma/client';
import { QuestEntryRule } from './quest.interface';
import { QuestGoal } from './quest-goal.entity';
import { QuestReward } from './quest-reward.entity';
import { QuestTranslation } from './quest-translation.entity';

export interface QuestMasterProps {
  id: bigint;
  displayOrder: number;
  type: QuestType;
  resetCycle: ResetCycle;
  maxAttempts: number | null;
  isActive: boolean;
  isHot: boolean;
  isNew: boolean;
  iconFileId: bigint | null;
  iconUrl: string | null;
  parentId: bigint | null;
  precedingId: bigint | null;
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
    displayOrder?: number;
    type: QuestType;
    resetCycle?: ResetCycle;
    maxAttempts?: number | null;
    isActive?: boolean;
    isHot?: boolean;
    isNew?: boolean;
    iconFileId?: bigint | null;
    iconUrl?: string | null;
    parentId?: bigint | null;
    precedingId?: bigint | null;
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
      displayOrder: params.displayOrder ?? 0,
      type: params.type,
      resetCycle: params.resetCycle ?? 'NONE',
      maxAttempts: params.maxAttempts ?? null,
      isActive: params.isActive ?? true,
      isHot: params.isHot ?? false,
      isNew: params.isNew ?? false,
      iconFileId: params.iconFileId ?? null,
      iconUrl: params.iconUrl ?? null,
      parentId: params.parentId ?? null,
      precedingId: params.precedingId ?? null,
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
  get displayOrder(): number { return this.props.displayOrder; }
  get type(): QuestType { return this.props.type; }
  get resetCycle(): ResetCycle { return this.props.resetCycle; }
  get maxAttempts(): number | null { return this.props.maxAttempts; }
  get isActive(): boolean { return this.props.isActive; }
  get isHot(): boolean { return this.props.isHot; }
  get isNew(): boolean { return this.props.isNew; }
  get iconFileId(): bigint | null { return this.props.iconFileId; }
  get iconUrl(): string | null { return this.props.iconUrl; }
  get parentId(): bigint | null { return this.props.parentId; }
  get precedingId(): bigint | null { return this.props.precedingId; }
  get entryRule(): QuestEntryRule { return this.props.entryRule; }
  get updatedBy(): bigint | null { return this.props.updatedBy; }
  get startTime(): Date | null { return this.props.startTime; }
  get endTime(): Date | null { return this.props.endTime; }
  get goals(): QuestGoal[] { return this.props.goals ?? []; }
  get rewards(): QuestReward[] { return this.props.rewards ?? []; }
  get translations(): QuestTranslation[] { return this.props.translations ?? []; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

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
   * 퀘스트 정보를 업데이트합니다.
   */
  update(params: Partial<{
    displayOrder: number;
    type: QuestType;
    resetCycle: ResetCycle;
    maxAttempts: number | null;
    isActive: boolean;
    isHot: boolean;
    isNew: boolean;
    iconFileId: bigint | null;
    iconUrl: string | null;
    parentId: bigint | null;
    precedingId: bigint | null;
    entryRule: QuestEntryRule;
    startTime: Date | null;
    endTime: Date | null;
    updatedBy: bigint | null;
    goals: QuestGoal[];
    rewards: QuestReward[];
    translations: QuestTranslation[];
  }>): void {
    Object.assign(this.props, {
      ...params,
      updatedAt: new Date(),
    });
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
