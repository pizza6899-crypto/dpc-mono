export interface QuestSystemConfigProps {
  id: bigint;
  isSystemEnabled: boolean;
  updatedAt: Date;
}

export class QuestSystemConfig {
  public static readonly DEFAULT_ID = 1n;

  private constructor(private readonly props: QuestSystemConfigProps) {}

  /**
   * 리포지토리(DB)에서 데이터를 불러와 엔티티로 변환할 때 사용합니다.
   */
  static fromPersistence(props: QuestSystemConfigProps): QuestSystemConfig {
    return new QuestSystemConfig(props);
  }

  // --- Getters ---

  get id(): bigint {
    return QuestSystemConfig.DEFAULT_ID;
  }
  get isSystemEnabled(): boolean {
    return this.props.isSystemEnabled;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // --- Business Methods ---

  /**
   * 설정을 업데이트합니다.
   */
  update(updateData: Partial<Omit<QuestSystemConfigProps, 'id' | 'updatedAt'>>): void {
    Object.assign(this.props, updateData);
  }
}
