// src/modules/affiliate/referral/domain/model/referral.entity.spec.ts
import { Referral } from './referral.entity';

describe('Referral', () => {
  const mockId = 'clx1234567890';
  const mockAffiliateId = 'affiliate-123';
  const mockCodeId = 'code-456';
  const mockSubUserId = 'sub-user-789';
  const mockIpAddress = '192.168.1.1';
  const mockDeviceFingerprint = 'fingerprint-abc';
  const mockUserAgent = 'Mozilla/5.0';

  describe('fromPersistence', () => {
    it('DB 데이터로부터 레퍼럴 엔티티를 생성한다', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-02T00:00:00Z');

      const referral = Referral.fromPersistence({
        id: mockId,
        affiliateId: mockAffiliateId,
        codeId: mockCodeId,
        subUserId: mockSubUserId,
        ipAddress: mockIpAddress,
        deviceFingerprint: mockDeviceFingerprint,
        userAgent: mockUserAgent,
        createdAt,
        updatedAt,
      });

      expect(referral.id).toBe(mockId);
      expect(referral.affiliateId).toBe(mockAffiliateId);
      expect(referral.codeId).toBe(mockCodeId);
      expect(referral.subUserId).toBe(mockSubUserId);
      expect(referral.ipAddress).toBe(mockIpAddress);
      expect(referral.deviceFingerprint).toBe(mockDeviceFingerprint);
      expect(referral.userAgent).toBe(mockUserAgent);
      expect(referral.createdAt).toEqual(createdAt);
      expect(referral.updatedAt).toEqual(updatedAt);
    });
  });

  describe('hasTrackingData', () => {
    it('추적 정보가 모두 없는 경우 false를 반환한다', () => {
      const referral = Referral.fromPersistence({
        id: mockId,
        affiliateId: mockAffiliateId,
        codeId: mockCodeId,
        subUserId: mockSubUserId,
        ipAddress: null,
        deviceFingerprint: null,
        userAgent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(referral.hasTrackingData()).toBe(false);
    });

    it('IP 주소만 있어도 true를 반환한다', () => {
      const referral = Referral.fromPersistence({
        id: mockId,
        affiliateId: mockAffiliateId,
        codeId: mockCodeId,
        subUserId: mockSubUserId,
        ipAddress: mockIpAddress,
        deviceFingerprint: null,
        userAgent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(referral.hasTrackingData()).toBe(true);
    });

    it('디바이스 핑거프린트만 있어도 true를 반환한다', () => {
      const referral = Referral.fromPersistence({
        id: mockId,
        affiliateId: mockAffiliateId,
        codeId: mockCodeId,
        subUserId: mockSubUserId,
        ipAddress: null,
        deviceFingerprint: mockDeviceFingerprint,
        userAgent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(referral.hasTrackingData()).toBe(true);
    });

    it('User-Agent만 있어도 true를 반환한다', () => {
      const referral = Referral.fromPersistence({
        id: mockId,
        affiliateId: mockAffiliateId,
        codeId: mockCodeId,
        subUserId: mockSubUserId,
        ipAddress: null,
        deviceFingerprint: null,
        userAgent: mockUserAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(referral.hasTrackingData()).toBe(true);
    });
  });

  describe('toPersistence', () => {
    it('DB 저장을 위한 데이터를 올바르게 변환한다', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-02T00:00:00Z');

      const referral = Referral.fromPersistence({
        id: mockId,
        affiliateId: mockAffiliateId,
        codeId: mockCodeId,
        subUserId: mockSubUserId,
        ipAddress: mockIpAddress,
        deviceFingerprint: mockDeviceFingerprint,
        userAgent: mockUserAgent,
        createdAt,
        updatedAt,
      });

      const persistence = referral.toPersistence();

      expect(persistence).toEqual({
        id: mockId,
        affiliateId: mockAffiliateId,
        codeId: mockCodeId,
        subUserId: mockSubUserId,
        ipAddress: mockIpAddress,
        deviceFingerprint: mockDeviceFingerprint,
        userAgent: mockUserAgent,
        createdAt,
        updatedAt,
      });
    });

    it('null 값의 추적 정보를 올바르게 변환한다', () => {
      const referral = Referral.fromPersistence({
        id: mockId,
        affiliateId: mockAffiliateId,
        codeId: mockCodeId,
        subUserId: mockSubUserId,
        ipAddress: null,
        deviceFingerprint: null,
        userAgent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const persistence = referral.toPersistence();

      expect(persistence.ipAddress).toBeNull();
      expect(persistence.deviceFingerprint).toBeNull();
      expect(persistence.userAgent).toBeNull();
    });
  });
});
