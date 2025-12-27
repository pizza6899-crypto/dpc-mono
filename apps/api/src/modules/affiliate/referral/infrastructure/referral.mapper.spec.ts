// src/modules/affiliate/referral/infrastructure/referral.mapper.spec.ts
import { ReferralMapper } from './referral.mapper';
import { Referral } from '../domain';

describe('ReferralMapper', () => {
  let mapper: ReferralMapper;

  beforeEach(() => {
    mapper = new ReferralMapper();
  });

  describe('toDomain', () => {
    it('should map Prisma model to domain entity', () => {
      const prismaModel = {
        id: 'test-id',
        affiliateId: 'affiliate-id',
        codeId: 'code-id',
        subUserId: 'sub-user-id',
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'fingerprint123',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const domainEntity = mapper.toDomain(prismaModel);

      expect(domainEntity).toBeInstanceOf(Referral);
      expect(domainEntity.id).toBe(prismaModel.id);
      expect(domainEntity.affiliateId).toBe(prismaModel.affiliateId);
      expect(domainEntity.codeId).toBe(prismaModel.codeId);
      expect(domainEntity.subUserId).toBe(prismaModel.subUserId);
      expect(domainEntity.ipAddress).toBe(prismaModel.ipAddress);
      expect(domainEntity.deviceFingerprint).toBe(
        prismaModel.deviceFingerprint,
      );
      expect(domainEntity.userAgent).toBe(prismaModel.userAgent);
      expect(domainEntity.createdAt).toEqual(prismaModel.createdAt);
      expect(domainEntity.updatedAt).toEqual(prismaModel.updatedAt);
    });

    it('should handle null values in tracking data', () => {
      const prismaModel = {
        id: 'test-id',
        affiliateId: 'affiliate-id',
        codeId: 'code-id',
        subUserId: 'sub-user-id',
        ipAddress: null,
        deviceFingerprint: null,
        userAgent: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const domainEntity = mapper.toDomain(prismaModel);

      expect(domainEntity.ipAddress).toBeNull();
      expect(domainEntity.deviceFingerprint).toBeNull();
      expect(domainEntity.userAgent).toBeNull();
      expect(domainEntity.hasTrackingData()).toBe(false);
    });

    it('should handle partial tracking data', () => {
      const prismaModel = {
        id: 'test-id',
        affiliateId: 'affiliate-id',
        codeId: 'code-id',
        subUserId: 'sub-user-id',
        ipAddress: '192.168.1.1',
        deviceFingerprint: null,
        userAgent: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const domainEntity = mapper.toDomain(prismaModel);

      expect(domainEntity.ipAddress).toBe('192.168.1.1');
      expect(domainEntity.deviceFingerprint).toBeNull();
      expect(domainEntity.userAgent).toBeNull();
      expect(domainEntity.hasTrackingData()).toBe(true);
    });
  });

  describe('toPrisma', () => {
    it('should map domain entity to Prisma model', () => {
      const domainEntity = Referral.fromPersistence({
        id: 'test-id',
        affiliateId: 'affiliate-id',
        codeId: 'code-id',
        subUserId: 'sub-user-id',
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'fingerprint123',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });

      const prismaModel = mapper.toPrisma(domainEntity);

      expect(prismaModel.id).toBe(domainEntity.id);
      expect(prismaModel.affiliateId).toBe(domainEntity.affiliateId);
      expect(prismaModel.codeId).toBe(domainEntity.codeId);
      expect(prismaModel.subUserId).toBe(domainEntity.subUserId);
      expect(prismaModel.ipAddress).toBe(domainEntity.ipAddress);
      expect(prismaModel.deviceFingerprint).toBe(
        domainEntity.deviceFingerprint,
      );
      expect(prismaModel.userAgent).toBe(domainEntity.userAgent);
      expect(prismaModel.createdAt).toEqual(domainEntity.createdAt);
      expect(prismaModel.updatedAt).toEqual(domainEntity.updatedAt);
    });

    it('should handle null values in tracking data', () => {
      const domainEntity = Referral.fromPersistence({
        id: 'test-id',
        affiliateId: 'affiliate-id',
        codeId: 'code-id',
        subUserId: 'sub-user-id',
        ipAddress: null,
        deviceFingerprint: null,
        userAgent: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });

      const prismaModel = mapper.toPrisma(domainEntity);

      expect(prismaModel.ipAddress).toBeNull();
      expect(prismaModel.deviceFingerprint).toBeNull();
      expect(prismaModel.userAgent).toBeNull();
    });

    it('should preserve all domain entity properties', () => {
      const domainEntity = Referral.fromPersistence({
        id: 'test-id',
        affiliateId: 'affiliate-id',
        codeId: 'code-id',
        subUserId: 'sub-user-id',
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'fingerprint123',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });

      const prismaModel = mapper.toPrisma(domainEntity);
      const persistence = domainEntity.toPersistence();

      expect(prismaModel).toEqual(persistence);
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const originalPrismaModel = {
        id: 'test-id',
        affiliateId: 'affiliate-id',
        codeId: 'code-id',
        subUserId: 'sub-user-id',
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'fingerprint123',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const domainEntity = mapper.toDomain(originalPrismaModel);
      const convertedPrismaModel = mapper.toPrisma(domainEntity);

      expect(convertedPrismaModel).toEqual(originalPrismaModel);
    });

    it('should handle null values in round-trip conversion', () => {
      const originalPrismaModel = {
        id: 'test-id',
        affiliateId: 'affiliate-id',
        codeId: 'code-id',
        subUserId: 'sub-user-id',
        ipAddress: null,
        deviceFingerprint: null,
        userAgent: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const domainEntity = mapper.toDomain(originalPrismaModel);
      const convertedPrismaModel = mapper.toPrisma(domainEntity);

      expect(convertedPrismaModel).toEqual(originalPrismaModel);
    });
  });
});
