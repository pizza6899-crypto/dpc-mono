// src/modules/auth/session/domain/model/device-info.vo.spec.ts
import { DeviceInfo } from './device-info.vo';

describe('DeviceInfo', () => {
  const mockIpAddress = '192.168.1.1';
  const mockUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  const mockDeviceFingerprint = 'fingerprint-abc123';
  const mockIsMobile = false;
  const mockDeviceName = 'Chrome on Windows';
  const mockOs = 'Windows 11';
  const mockBrowser = 'Chrome 120';

  describe('create', () => {
    it('모든 파라미터를 포함하여 디바이스 정보를 생성한다', () => {
      const deviceInfo = DeviceInfo.create({
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: mockIsMobile,
        deviceName: mockDeviceName,
        os: mockOs,
        browser: mockBrowser,
      });

      expect(deviceInfo.ipAddress).toBe(mockIpAddress);
      expect(deviceInfo.userAgent).toBe(mockUserAgent);
      expect(deviceInfo.deviceFingerprint).toBe(mockDeviceFingerprint);
      expect(deviceInfo.isMobile).toBe(mockIsMobile);
      expect(deviceInfo.deviceName).toBe(mockDeviceName);
      expect(deviceInfo.os).toBe(mockOs);
      expect(deviceInfo.browser).toBe(mockBrowser);
    });

    it('일부 파라미터만 포함하여 디바이스 정보를 생성한다', () => {
      const deviceInfo = DeviceInfo.create({
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
      });

      expect(deviceInfo.ipAddress).toBe(mockIpAddress);
      expect(deviceInfo.userAgent).toBe(mockUserAgent);
      expect(deviceInfo.deviceFingerprint).toBeNull();
      expect(deviceInfo.isMobile).toBeNull();
      expect(deviceInfo.deviceName).toBeNull();
      expect(deviceInfo.os).toBeNull();
      expect(deviceInfo.browser).toBeNull();
    });

    it('파라미터 없이 디바이스 정보를 생성한다', () => {
      const deviceInfo = DeviceInfo.create({});

      expect(deviceInfo.ipAddress).toBeNull();
      expect(deviceInfo.userAgent).toBeNull();
      expect(deviceInfo.deviceFingerprint).toBeNull();
      expect(deviceInfo.isMobile).toBeNull();
      expect(deviceInfo.deviceName).toBeNull();
      expect(deviceInfo.os).toBeNull();
      expect(deviceInfo.browser).toBeNull();
    });

    it('null 값을 명시적으로 전달하여 디바이스 정보를 생성한다', () => {
      const deviceInfo = DeviceInfo.create({
        ipAddress: null,
        userAgent: null,
        deviceFingerprint: null,
        isMobile: null,
        deviceName: null,
        os: null,
        browser: null,
      });

      expect(deviceInfo.ipAddress).toBeNull();
      expect(deviceInfo.userAgent).toBeNull();
      expect(deviceInfo.deviceFingerprint).toBeNull();
      expect(deviceInfo.isMobile).toBeNull();
      expect(deviceInfo.deviceName).toBeNull();
      expect(deviceInfo.os).toBeNull();
      expect(deviceInfo.browser).toBeNull();
    });

    it('모바일 디바이스 정보를 생성한다', () => {
      const deviceInfo = DeviceInfo.create({
        ipAddress: mockIpAddress,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        deviceFingerprint: 'mobile-fingerprint-123',
        isMobile: true,
        deviceName: 'iPhone 14 Pro',
        os: 'iOS 17.0',
        browser: 'Safari 17',
      });

      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.deviceName).toBe('iPhone 14 Pro');
      expect(deviceInfo.os).toBe('iOS 17.0');
      expect(deviceInfo.browser).toBe('Safari 17');
    });
  });

  describe('fromPersistence', () => {
    it('DB 데이터로부터 디바이스 정보를 생성한다', () => {
      const persistenceData = {
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: mockIsMobile,
        deviceName: mockDeviceName,
        os: mockOs,
        browser: mockBrowser,
      };

      const deviceInfo = DeviceInfo.fromPersistence(persistenceData);

      expect(deviceInfo.ipAddress).toBe(mockIpAddress);
      expect(deviceInfo.userAgent).toBe(mockUserAgent);
      expect(deviceInfo.deviceFingerprint).toBe(mockDeviceFingerprint);
      expect(deviceInfo.isMobile).toBe(mockIsMobile);
      expect(deviceInfo.deviceName).toBe(mockDeviceName);
      expect(deviceInfo.os).toBe(mockOs);
      expect(deviceInfo.browser).toBe(mockBrowser);
    });

    it('null 값이 포함된 DB 데이터로부터 디바이스 정보를 생성한다', () => {
      const persistenceData = {
        ipAddress: null,
        userAgent: mockUserAgent,
        deviceFingerprint: null,
        isMobile: null,
        deviceName: null,
        os: null,
        browser: null,
      };

      const deviceInfo = DeviceInfo.fromPersistence(persistenceData);

      expect(deviceInfo.ipAddress).toBeNull();
      expect(deviceInfo.userAgent).toBe(mockUserAgent);
      expect(deviceInfo.deviceFingerprint).toBeNull();
      expect(deviceInfo.isMobile).toBeNull();
      expect(deviceInfo.deviceName).toBeNull();
      expect(deviceInfo.os).toBeNull();
      expect(deviceInfo.browser).toBeNull();
    });

    it('모든 필드가 null인 DB 데이터로부터 디바이스 정보를 생성한다', () => {
      const persistenceData = {
        ipAddress: null,
        userAgent: null,
        deviceFingerprint: null,
        isMobile: null,
        deviceName: null,
        os: null,
        browser: null,
      };

      const deviceInfo = DeviceInfo.fromPersistence(persistenceData);

      expect(deviceInfo.ipAddress).toBeNull();
      expect(deviceInfo.userAgent).toBeNull();
      expect(deviceInfo.deviceFingerprint).toBeNull();
      expect(deviceInfo.isMobile).toBeNull();
      expect(deviceInfo.deviceName).toBeNull();
      expect(deviceInfo.os).toBeNull();
      expect(deviceInfo.browser).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('디바이스 정보를 Persistence 형식으로 변환한다', () => {
      const deviceInfo = DeviceInfo.create({
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: mockIsMobile,
        deviceName: mockDeviceName,
        os: mockOs,
        browser: mockBrowser,
      });

      const persistence = deviceInfo.toPersistence();

      expect(persistence).toEqual({
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: mockIsMobile,
        deviceName: mockDeviceName,
        os: mockOs,
        browser: mockBrowser,
      });
    });

    it('null 값이 포함된 디바이스 정보를 Persistence 형식으로 변환한다', () => {
      const deviceInfo = DeviceInfo.create({
        ipAddress: null,
        userAgent: mockUserAgent,
        deviceFingerprint: null,
        isMobile: null,
        deviceName: null,
        os: null,
        browser: null,
      });

      const persistence = deviceInfo.toPersistence();

      expect(persistence).toEqual({
        ipAddress: null,
        userAgent: mockUserAgent,
        deviceFingerprint: null,
        isMobile: null,
        deviceName: null,
        os: null,
        browser: null,
      });
    });

    it('fromPersistence로 생성한 디바이스 정보를 Persistence 형식으로 변환한다', () => {
      const persistenceData = {
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: mockIsMobile,
        deviceName: mockDeviceName,
        os: mockOs,
        browser: mockBrowser,
      };

      const deviceInfo = DeviceInfo.fromPersistence(persistenceData);
      const persistence = deviceInfo.toPersistence();

      expect(persistence).toEqual(persistenceData);
    });
  });

  describe('getDeviceIdentifier', () => {
    it('deviceFingerprint가 있으면 deviceFingerprint를 반환한다', () => {
      const deviceInfo = DeviceInfo.create({
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
      });

      const identifier = deviceInfo.getDeviceIdentifier();

      expect(identifier).toBe(mockDeviceFingerprint);
    });

    it('deviceFingerprint가 없고 userAgent와 ipAddress가 있으면 조합된 문자열을 반환한다', () => {
      const deviceInfo = DeviceInfo.create({
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: null,
      });

      const identifier = deviceInfo.getDeviceIdentifier();

      expect(identifier).toBe(`${mockUserAgent}:${mockIpAddress}`);
    });

    it('deviceFingerprint가 없고 userAgent만 있으면 null을 반환한다', () => {
      const deviceInfo = DeviceInfo.create({
        ipAddress: null,
        userAgent: mockUserAgent,
        deviceFingerprint: null,
      });

      const identifier = deviceInfo.getDeviceIdentifier();

      expect(identifier).toBeNull();
    });

    it('deviceFingerprint가 없고 ipAddress만 있으면 null을 반환한다', () => {
      const deviceInfo = DeviceInfo.create({
        ipAddress: mockIpAddress,
        userAgent: null,
        deviceFingerprint: null,
      });

      const identifier = deviceInfo.getDeviceIdentifier();

      expect(identifier).toBeNull();
    });

    it('모든 필드가 null이면 null을 반환한다', () => {
      const deviceInfo = DeviceInfo.create({
        ipAddress: null,
        userAgent: null,
        deviceFingerprint: null,
      });

      const identifier = deviceInfo.getDeviceIdentifier();

      expect(identifier).toBeNull();
    });

    it('deviceFingerprint가 있으면 다른 필드와 관계없이 deviceFingerprint를 반환한다', () => {
      const deviceInfo = DeviceInfo.create({
        ipAddress: null,
        userAgent: null,
        deviceFingerprint: mockDeviceFingerprint,
      });

      const identifier = deviceInfo.getDeviceIdentifier();

      expect(identifier).toBe(mockDeviceFingerprint);
    });
  });

  describe('Integration', () => {
    it('create → toPersistence → fromPersistence 순환 테스트', () => {
      const original = DeviceInfo.create({
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: mockIsMobile,
        deviceName: mockDeviceName,
        os: mockOs,
        browser: mockBrowser,
      });

      const persistence = original.toPersistence();
      const recreated = DeviceInfo.fromPersistence(persistence);

      expect(recreated.ipAddress).toBe(original.ipAddress);
      expect(recreated.userAgent).toBe(original.userAgent);
      expect(recreated.deviceFingerprint).toBe(original.deviceFingerprint);
      expect(recreated.isMobile).toBe(original.isMobile);
      expect(recreated.deviceName).toBe(original.deviceName);
      expect(recreated.os).toBe(original.os);
      expect(recreated.browser).toBe(original.browser);
    });

    it('fromPersistence → toPersistence → fromPersistence 순환 테스트', () => {
      const persistenceData = {
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: mockIsMobile,
        deviceName: mockDeviceName,
        os: mockOs,
        browser: mockBrowser,
      };

      const original = DeviceInfo.fromPersistence(persistenceData);
      const persistence = original.toPersistence();
      const recreated = DeviceInfo.fromPersistence(persistence);

      expect(recreated.ipAddress).toBe(original.ipAddress);
      expect(recreated.userAgent).toBe(original.userAgent);
      expect(recreated.deviceFingerprint).toBe(original.deviceFingerprint);
      expect(recreated.isMobile).toBe(original.isMobile);
      expect(recreated.deviceName).toBe(original.deviceName);
      expect(recreated.os).toBe(original.os);
      expect(recreated.browser).toBe(original.browser);
    });

    it('null 값이 포함된 데이터의 순환 테스트', () => {
      const original = DeviceInfo.create({
        ipAddress: null,
        userAgent: mockUserAgent,
        deviceFingerprint: null,
        isMobile: null,
        deviceName: null,
        os: null,
        browser: null,
      });

      const persistence = original.toPersistence();
      const recreated = DeviceInfo.fromPersistence(persistence);

      expect(recreated.ipAddress).toBe(original.ipAddress);
      expect(recreated.userAgent).toBe(original.userAgent);
      expect(recreated.deviceFingerprint).toBe(original.deviceFingerprint);
      expect(recreated.isMobile).toBe(original.isMobile);
      expect(recreated.deviceName).toBe(original.deviceName);
      expect(recreated.os).toBe(original.os);
      expect(recreated.browser).toBe(original.browser);
    });
  });
});

