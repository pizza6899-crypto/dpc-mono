// src/modules/affiliate/referral/domain/model/referral.entity.ts

export class Referral {
  private constructor(
    public readonly id: string,
    public readonly affiliateId: string,
    public readonly codeId: string,
    public readonly subUserId: string,
    private readonly _ipAddress: string | null,
    private readonly _deviceFingerprint: string | null,
    private readonly _userAgent: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   * Repository에서 Prisma를 통해 생성/조회된 데이터를 Domain Entity로 변환할 때 사용
   * ID는 Prisma의 @default(cuid())로 자동 생성되므로 별도로 받지 않음
   * @param data - DB에서 조회한 레퍼럴 데이터
   * @returns Referral 엔티티 인스턴스
   */
  static fromPersistence(data: {
    id: string;
    affiliateId: string;
    codeId: string;
    subUserId: string;
    ipAddress: string | null;
    deviceFingerprint: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Referral {
    return new Referral(
      data.id,
      data.affiliateId,
      data.codeId,
      data.subUserId,
      data.ipAddress,
      data.deviceFingerprint,
      data.userAgent,
      data.createdAt,
      data.updatedAt,
    );
  }

  // Getters
  get ipAddress(): string | null {
    return this._ipAddress;
  }

  get deviceFingerprint(): string | null {
    return this._deviceFingerprint;
  }

  get userAgent(): string | null {
    return this._userAgent;
  }

  // Business Logic Methods

  /**
   * 추적 정보가 있는지 확인
   * @returns IP 주소, 디바이스 핑거프린트, User-Agent 중 하나라도 있으면 true
   */
  hasTrackingData(): boolean {
    return !!(this._ipAddress || this._deviceFingerprint || this._userAgent);
  }

  /**
   * DB 저장을 위한 데이터 변환
   * @returns DB에 저장할 형태의 데이터
   */
  toPersistence() {
    return {
      id: this.id,
      affiliateId: this.affiliateId,
      codeId: this.codeId,
      subUserId: this.subUserId,
      ipAddress: this._ipAddress,
      deviceFingerprint: this._deviceFingerprint,
      userAgent: this._userAgent,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
