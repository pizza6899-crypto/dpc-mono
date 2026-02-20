// src/modules/affiliate/code/domain/model/affiliate-code.entity.ts
import { AffiliateCodeValue } from './affiliate-code-value';

export class AffiliateCode {
  private constructor(
    public readonly id: bigint | null,
    public readonly uid: string,
    public readonly userId: bigint,
    private _code: AffiliateCodeValue,
    private _campaignName: string | null,
    private _isActive: boolean,
    private _isDefault: boolean,
    private _expiresAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private _lastUsedAt: Date | null,
  ) {}

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   * Repository에서 Prisma를 통해 생성/조회된 데이터를 Domain Entity로 변환할 때 사용
   * ID는 Prisma의 @default(cuid())로 자동 생성되므로 별도로 받지 않음
   */
  static fromPersistence(data: {
    id: bigint;
    uid: string;
    userId: bigint;
    code: string;
    campaignName: string | null;
    isActive: boolean;
    isDefault: boolean;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date | null;
  }): AffiliateCode {
    return new AffiliateCode(
      data.id,
      data.uid,
      data.userId,
      AffiliateCodeValue.create(data.code),
      data.campaignName,
      data.isActive,
      data.isDefault,
      data.expiresAt,
      data.createdAt,
      data.updatedAt,
      data.lastUsedAt,
    );
  }

  // Getters
  get code(): string {
    return this._code.value;
  }

  get campaignName(): string | null {
    return this._campaignName;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }

  get expiresAt(): Date | null {
    return this._expiresAt;
  }

  get lastUsedAt(): Date | null {
    return this._lastUsedAt;
  }

  // Business Logic Methods
  /**
   * 캠페인 이름 업데이트
   * @param campaignName - 새로운 캠페인 이름
   *   - `string`: 캠페인 이름 설정
   *   - `null`: 캠페인 이름 제거 (기존 값이 있어도 제거됨)
   *   - `undefined`: 업데이트 안 함 (기존 값 유지)
   */
  updateCampaignName(campaignName?: string | null): void {
    if (campaignName !== undefined) {
      this._campaignName = campaignName;
    }
  }

  setActive(isActive: boolean): void {
    this._isActive = isActive;
  }

  toggleActive(): void {
    this._isActive = !this._isActive;
  }

  setAsDefault(): void {
    this._isDefault = true;
  }

  unsetAsDefault(): void {
    this._isDefault = false;
  }

  markAsUsed(): void {
    this._lastUsedAt = new Date();
  }

  isExpired(): boolean {
    if (!this._expiresAt) {
      return false;
    }
    return this._expiresAt < new Date();
  }

  canBeDeleted(totalCodes: number): boolean {
    // 기본 코드이고 유일한 코드인 경우 삭제 불가
    if (this._isDefault && totalCodes === 1) {
      return false;
    }
    return true;
  }

  toPersistence() {
    return {
      id: this.id,
      uid: this.uid,
      userId: this.userId,
      code: this._code.value,
      campaignName: this._campaignName,
      isActive: this._isActive,
      isDefault: this._isDefault,
      expiresAt: this._expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastUsedAt: this._lastUsedAt,
    };
  }
}
