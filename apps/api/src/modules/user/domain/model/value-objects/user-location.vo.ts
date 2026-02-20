// src/modules/user/domain/model/value-objects/user-location.vo.ts

/**
 * UserLocation Value Object
 *
 * 사용자 위치 및 지역 정보를 담당하는 Value Object입니다.
 * 국가, 타임존 등을 포함합니다.
 */
export class UserLocation {
  private constructor(
    public readonly country: string | null,
    public readonly timezone: string | null,
  ) {}

  /**
   * UserLocation 생성
   */
  static create(params: {
    country?: string | null;
    timezone?: string | null;
  }): UserLocation {
    return new UserLocation(params.country || null, params.timezone || null);
  }

  /**
   * Persistence 데이터로부터 생성
   */
  static fromPersistence(data: {
    country: string | null;
    timezone: string | null;
  }): UserLocation {
    return new UserLocation(data.country, data.timezone);
  }

  /**
   * Persistence 레이어로 변환
   */
  toPersistence(): {
    country: string | null;
    timezone: string | null;
  } {
    return {
      country: this.country,
      timezone: this.timezone,
    };
  }

  /**
   * 위치 정보 업데이트
   */
  update(
    updates: Partial<{
      country: string | null;
      timezone: string | null;
    }>,
  ): UserLocation {
    return new UserLocation(
      updates.country !== undefined ? updates.country : this.country,
      updates.timezone !== undefined ? updates.timezone : this.timezone,
    );
  }
}
