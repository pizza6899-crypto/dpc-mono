import { createHash } from 'node:crypto';

/**
 * [UniversalLog] User-Agent 통합 카탈로그 엔티티
 * 중복되는 긴 브라우저 정보를 단일화하여 저장 공간 및 쿼리 성능을 최적화합니다.
 */
export class UserAgentCatalog {
  private constructor(
    private readonly _id: bigint,
    private readonly _uaHash: string, // SHA-256 해시값
    private readonly _uaString: string, // 원본 UA 전체 내용
    private readonly _browser: string | null, // 파싱된 브라우저
    private readonly _os: string | null, // 파싱된 OS
    private readonly _device: string | null, // 파싱된 디바이스
    private readonly _createdAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate(data: {
    id: bigint;
    uaHash: string;
    uaString: string;
    browser: string | null;
    os: string | null;
    device: string | null;
    createdAt: Date;
  }): UserAgentCatalog {
    return new UserAgentCatalog(
      data.id,
      data.uaHash,
      data.uaString,
      data.browser,
      data.os,
      data.device,
      data.createdAt,
    );
  }

  /**
   * 원본 User-Agent 문자열로부터 새로운 카탈로그 엔티티 생성
   * 내부적으로 SHA-256 해싱을 수행합니다.
   */
  static fromRaw(uaString: string): UserAgentCatalog {
    const uaHash = createHash('sha256').update(uaString).digest('hex');

    return new UserAgentCatalog(
      0n, // DB에서 자동 생성될 값이므로 초기값 0 부여
      uaHash,
      uaString,
      null,
      null,
      null,
      new Date(),
    );
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get uaHash(): string { return this._uaHash; }
  get uaString(): string { return this._uaString; }
  get browser(): string | null { return this._browser; }
  get os(): string | null { return this._os; }
  get device(): string | null { return this._device; }
  get createdAt(): Date { return this._createdAt; }
}
