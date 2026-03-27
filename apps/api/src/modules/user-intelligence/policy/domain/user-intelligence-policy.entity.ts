import { PolicyConfiguration } from './policy-config.types';

/**
 * [User Intelligence] 스코어링 정책 엔티티
 * 가중치 및 임계값 설정을 관리하며 유닛 테스트 및 비즈니스 로직의 기준이 됩니다.
 */
export class UserIntelligencePolicy {
  private constructor(
    private readonly _id: number,
    private readonly _config: PolicyConfiguration,
    private readonly _adminNote: string | null,
    private readonly _isActive: boolean,
    private readonly _createdAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate(data: {
    id: number;
    config: any; // DB Json 타입
    adminNote: string | null;
    isActive: boolean;
    createdAt: Date;
  }): UserIntelligencePolicy {
    return new UserIntelligencePolicy(
      data.id,
      data.config as unknown as PolicyConfiguration,
      data.adminNote,
      data.isActive,
      data.createdAt,
    );
  }

  /**
   * 새로운 정책 엔티티 생성
   */
  static create(params: {
    config: PolicyConfiguration;
    adminNote?: string;
  }): UserIntelligencePolicy {
    return new UserIntelligencePolicy(
      0, // 신규 생성 시 ID는 DB에서 할당
      params.config,
      params.adminNote ?? null,
      true,
      new Date(),
    );
  }

  // --- Getters ---
  get id(): number { return this._id; }
  get config(): PolicyConfiguration { return this._config; }
  get adminNote(): string | null { return this._adminNote; }
  get isActive(): boolean { return this._isActive; }
  get createdAt(): Date { return this._createdAt; }

  // --- 비즈니스 로직 (Helper Getters) ---

  get valueIndex() { return this._config.valueIndex; }
  get depositAmount() { return this._config.depositAmount; }
  get depositCount() { return this._config.depositCount; }
  get rolling() { return this._config.rolling; }
  get behavior() { return this._config.behavior; }
  get riskPromotion() { return this._config.riskPromotion; }
  get riskTechnical() { return this._config.riskTechnical; }
  get riskBehavior() { return this._config.riskBehavior; }
}
