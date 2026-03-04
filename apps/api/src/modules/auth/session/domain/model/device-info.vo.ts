/**
 * 디바이스 정보 값 객체 (Value Object)
 *
 * 세션을 생성한 디바이스의 정보를 담습니다.
 * 불변 객체로 설계하여 세션 생성 후 변경되지 않습니다.
 */
export class DeviceInfo {
  private constructor(
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly deviceFingerprint: string | null,
    public readonly isMobile: boolean | null,
    public readonly deviceName: string | null, // 예: "iPhone 14 Pro", "Chrome on Windows"
    public readonly os: string | null, // 예: "iOS 17.0", "Windows 11"
    public readonly browser: string | null, // 예: "Chrome 120", "Safari 17"
  ) { }

  /**
   * 디바이스 정보 생성
   */
  static create(params: {
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceFingerprint?: string | null;
    isMobile?: boolean | null;
    deviceName?: string | null;
    os?: string | null;
    browser?: string | null;
  }): DeviceInfo {
    return new DeviceInfo(
      params.ipAddress ?? null,
      params.userAgent ?? null,
      params.deviceFingerprint ?? null,
      params.isMobile ?? null,
      params.deviceName ?? null,
      params.os ?? null,
      params.browser ?? null,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 생성
   */
  static fromPersistence(data: {
    ipAddress: string | null;
    userAgent: string | null;
    deviceFingerprint: string | null;
    isMobile: boolean | null;
    deviceName: string | null;
    os: string | null;
    browser: string | null;
  }): DeviceInfo {
    return new DeviceInfo(
      data.ipAddress,
      data.userAgent,
      data.deviceFingerprint,
      data.isMobile,
      data.deviceName,
      data.os,
      data.browser,
    );
  }

  /**
   * Persistence 레이어로 변환
   */
  toPersistence() {
    return {
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      deviceFingerprint: this.deviceFingerprint,
      isMobile: this.isMobile,
      deviceName: this.deviceName,
      os: this.os,
      browser: this.browser,
    };
  }

  /**
   * 디바이스 식별자 생성
   * 동일한 디바이스인지 판단하는 데 사용할 수 있는 식별자
   */
  getDeviceIdentifier(): string | null {
    if (this.deviceFingerprint) {
      return this.deviceFingerprint;
    }
    // fingerprint가 없으면 userAgent + IP 조합 사용
    if (this.userAgent && this.ipAddress) {
      return `${this.userAgent}:${this.ipAddress}`;
    }
    return null;
  }
}
