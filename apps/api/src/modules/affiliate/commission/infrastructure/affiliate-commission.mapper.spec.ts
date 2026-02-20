// src/modules/affiliate/commission/infrastructure/affiliate-commission.mapper.spec.ts
import { CommissionStatus, ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { AffiliateCommission } from '../domain';
import { AffiliateCommissionMapper } from './affiliate-commission.mapper';

describe('AffiliateCommissionMapper', () => {
  let mapper: AffiliateCommissionMapper;

  const mockId = BigInt(1);
  const mockUid = 'cmt-1234567890';
  const mockAffiliateId = 'affiliate-123';
  const mockSubUserId = 'user-456';
  const mockGameRoundId = BigInt(789);
  const mockWagerAmount = new Prisma.Decimal('10000');
  const mockWinAmount = new Prisma.Decimal('5000');
  const mockCommission = new Prisma.Decimal('100');
  const mockRateApplied = new Prisma.Decimal('0.01');
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockStatus = CommissionStatus.PENDING;
  const mockGameCategory = 'SLOTS';
  const mockSettlementDate = new Date('2024-01-15T00:00:00Z');
  const mockClaimedAt = new Date('2024-01-20T00:00:00Z');
  const mockWithdrawnAt = new Date('2024-01-25T00:00:00Z');
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    mapper = new AffiliateCommissionMapper();
  });

  describe('toDomain', () => {
    it('Prisma 모델을 도메인 엔티티로 변환한다', () => {
      // Given
      const prismaModel = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: mockStatus,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(prismaModel);

      // Then
      expect(domainEntity).toBeInstanceOf(AffiliateCommission);
      expect(domainEntity.id).toBe(prismaModel.id);
      expect(domainEntity.uid).toBe(prismaModel.uid);
      expect(domainEntity.affiliateId).toBe(prismaModel.affiliateId);
      expect(domainEntity.subUserId).toBe(prismaModel.subUserId);
      expect(domainEntity.gameRoundId).toBe(prismaModel.gameRoundId);
      expect(domainEntity.wagerAmount.equals(prismaModel.wagerAmount)).toBe(
        true,
      );
      expect(domainEntity.winAmount?.equals(prismaModel.winAmount)).toBe(true);
      expect(domainEntity.commission.equals(prismaModel.commission)).toBe(true);
      expect(domainEntity.rateApplied.equals(prismaModel.rateApplied)).toBe(
        true,
      );
      expect(domainEntity.currency).toBe(prismaModel.currency);
      expect(domainEntity.status).toBe(prismaModel.status);
      expect(domainEntity.gameCategory).toBe(prismaModel.gameCategory);
      expect(domainEntity.settlementDate).toBeNull();
      expect(domainEntity.claimedAt).toBeNull();
      expect(domainEntity.withdrawnAt).toBeNull();
      expect(domainEntity.createdAt).toEqual(prismaModel.createdAt);
      expect(domainEntity.updatedAt).toEqual(prismaModel.updatedAt);
    });

    it('null 값들을 올바르게 처리한다', () => {
      // Given
      const prismaModel = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: null,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: mockStatus,
        gameCategory: null,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(prismaModel);

      // Then
      expect(domainEntity.gameRoundId).toBeNull();
      expect(domainEntity.winAmount).toBeNull();
      expect(domainEntity.gameCategory).toBeNull();
      expect(domainEntity.settlementDate).toBeNull();
      expect(domainEntity.claimedAt).toBeNull();
      expect(domainEntity.withdrawnAt).toBeNull();
    });

    it('정산 완료된 커미션을 올바르게 변환한다', () => {
      // Given
      const prismaModel = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.AVAILABLE,
        settlementDate: mockSettlementDate,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(prismaModel);

      // Then
      expect(domainEntity.status).toBe(CommissionStatus.AVAILABLE);
      expect(domainEntity.settlementDate).toEqual(mockSettlementDate);
    });

    it('출금 완료된 커미션을 올바르게 변환한다', () => {
      // Given
      const prismaModel = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.WITHDRAWN,
        settlementDate: mockSettlementDate,
        claimedAt: mockClaimedAt,
        withdrawnAt: mockWithdrawnAt,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(prismaModel);

      // Then
      expect(domainEntity.status).toBe(CommissionStatus.WITHDRAWN);
      expect(domainEntity.settlementDate).toEqual(mockSettlementDate);
      expect(domainEntity.claimedAt).toEqual(mockClaimedAt);
      expect(domainEntity.withdrawnAt).toEqual(mockWithdrawnAt);
    });
  });

  describe('toPrisma', () => {
    it('도메인 엔티티를 Prisma 모델로 변환한다', () => {
      // Given
      const domainEntity = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: mockStatus,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      // When
      const prismaModel = mapper.toPrisma(domainEntity);

      // Then
      expect(prismaModel.id).toBe(domainEntity.id);
      expect(prismaModel.uid).toBe(domainEntity.uid);
      expect(prismaModel.affiliateId).toBe(domainEntity.affiliateId);
      expect(prismaModel.subUserId).toBe(domainEntity.subUserId);
      expect(prismaModel.gameRoundId).toBe(domainEntity.gameRoundId);
      expect(prismaModel.wagerAmount.equals(domainEntity.wagerAmount)).toBe(
        true,
      );
      expect(prismaModel.winAmount?.equals(domainEntity.winAmount)).toBe(true);
      expect(prismaModel.commission.equals(domainEntity.commission)).toBe(true);
      expect(prismaModel.rateApplied.equals(domainEntity.rateApplied)).toBe(
        true,
      );
      expect(prismaModel.currency).toBe(domainEntity.currency);
      expect(prismaModel.status).toBe(domainEntity.status);
      expect(prismaModel.gameCategory).toBe(domainEntity.gameCategory);
      expect(prismaModel.settlementDate).toBeNull();
      expect(prismaModel.claimedAt).toBeNull();
      expect(prismaModel.withdrawnAt).toBeNull();
      expect(prismaModel.createdAt).toEqual(domainEntity.createdAt);
      expect(prismaModel.updatedAt).toEqual(domainEntity.updatedAt);
    });

    it('도메인 엔티티의 모든 속성을 보존한다', () => {
      // Given
      const domainEntity = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: mockStatus,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      // When
      const prismaModel = mapper.toPrisma(domainEntity);
      const persistence = domainEntity.toPersistence();

      // Then
      expect(prismaModel.id).toBe(persistence.id);
      expect(prismaModel.uid).toBe(persistence.uid);
      expect(prismaModel.affiliateId).toBe(persistence.affiliateId);
      expect(prismaModel.subUserId).toBe(persistence.subUserId);
      expect(prismaModel.gameRoundId).toBe(persistence.gameRoundId);
      expect(prismaModel.wagerAmount.equals(persistence.wagerAmount)).toBe(
        true,
      );
      expect(prismaModel.winAmount?.equals(persistence.winAmount)).toBe(true);
      expect(prismaModel.commission.equals(persistence.commission)).toBe(true);
      expect(prismaModel.rateApplied.equals(persistence.rateApplied)).toBe(
        true,
      );
      expect(prismaModel.currency).toBe(persistence.currency);
      expect(prismaModel.status).toBe(persistence.status);
      expect(prismaModel.gameCategory).toBe(persistence.gameCategory);
      expect(prismaModel.settlementDate).toEqual(persistence.settlementDate);
      expect(prismaModel.claimedAt).toEqual(persistence.claimedAt);
      expect(prismaModel.withdrawnAt).toEqual(persistence.withdrawnAt);
      expect(prismaModel.createdAt).toEqual(persistence.createdAt);
      expect(prismaModel.updatedAt).toEqual(persistence.updatedAt);
    });

    it('새로 생성된 엔티티(id=null)를 올바르게 변환한다', () => {
      // Given
      const domainEntity = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
      });

      // When
      const prismaModel = mapper.toPrisma(domainEntity);

      // Then
      expect(prismaModel.id).toBeNull();
      expect(prismaModel.uid).toBe(mockUid);
    });
  });

  describe('Round-trip conversion', () => {
    it('왕복 변환을 통해 데이터 무결성을 유지한다', () => {
      // Given
      const originalPrismaModel = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: mockStatus,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(originalPrismaModel);
      const convertedPrismaModel = mapper.toPrisma(domainEntity);

      // Then
      expect(convertedPrismaModel.id).toBe(originalPrismaModel.id);
      expect(convertedPrismaModel.uid).toBe(originalPrismaModel.uid);
      expect(convertedPrismaModel.affiliateId).toBe(
        originalPrismaModel.affiliateId,
      );
      expect(convertedPrismaModel.subUserId).toBe(
        originalPrismaModel.subUserId,
      );
      expect(convertedPrismaModel.gameRoundId).toBe(
        originalPrismaModel.gameRoundId,
      );
      expect(
        convertedPrismaModel.wagerAmount.equals(
          originalPrismaModel.wagerAmount,
        ),
      ).toBe(true);
      expect(
        convertedPrismaModel.winAmount?.equals(originalPrismaModel.winAmount),
      ).toBe(true);
      expect(
        convertedPrismaModel.commission.equals(originalPrismaModel.commission),
      ).toBe(true);
      expect(
        convertedPrismaModel.rateApplied.equals(
          originalPrismaModel.rateApplied,
        ),
      ).toBe(true);
      expect(convertedPrismaModel.currency).toBe(originalPrismaModel.currency);
      expect(convertedPrismaModel.status).toBe(originalPrismaModel.status);
      expect(convertedPrismaModel.gameCategory).toBe(
        originalPrismaModel.gameCategory,
      );
      expect(convertedPrismaModel.settlementDate).toEqual(
        originalPrismaModel.settlementDate,
      );
      expect(convertedPrismaModel.claimedAt).toEqual(
        originalPrismaModel.claimedAt,
      );
      expect(convertedPrismaModel.withdrawnAt).toEqual(
        originalPrismaModel.withdrawnAt,
      );
      expect(convertedPrismaModel.createdAt).toEqual(
        originalPrismaModel.createdAt,
      );
      expect(convertedPrismaModel.updatedAt).toEqual(
        originalPrismaModel.updatedAt,
      );
    });

    it('null 값들을 포함한 왕복 변환을 수행한다', () => {
      // Given
      const originalPrismaModel = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: null,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: mockStatus,
        gameCategory: null,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(originalPrismaModel);
      const convertedPrismaModel = mapper.toPrisma(domainEntity);

      // Then
      expect(convertedPrismaModel.gameRoundId).toBeNull();
      expect(convertedPrismaModel.winAmount).toBeNull();
      expect(convertedPrismaModel.gameCategory).toBeNull();
      expect(convertedPrismaModel.settlementDate).toBeNull();
      expect(convertedPrismaModel.claimedAt).toBeNull();
      expect(convertedPrismaModel.withdrawnAt).toBeNull();
    });

    it('모든 상태의 커미션으로 왕복 변환을 수행한다', () => {
      // Given
      const statuses = [
        CommissionStatus.PENDING,
        CommissionStatus.AVAILABLE,
        CommissionStatus.CLAIMED,
        CommissionStatus.WITHDRAWN,
        CommissionStatus.CANCELLED,
      ];

      statuses.forEach((status) => {
        const originalPrismaModel = {
          id: mockId,
          uid: mockUid,
          affiliateId: mockAffiliateId,
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          commission: mockCommission,
          rateApplied: mockRateApplied,
          currency: mockCurrency,
          status,
          settlementDate:
            status === CommissionStatus.AVAILABLE ? mockSettlementDate : null,
          claimedAt:
            status === CommissionStatus.CLAIMED ||
            status === CommissionStatus.WITHDRAWN
              ? mockClaimedAt
              : null,
          withdrawnAt:
            status === CommissionStatus.WITHDRAWN ? mockWithdrawnAt : null,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        };

        // When
        const domainEntity = mapper.toDomain(originalPrismaModel);
        const convertedPrismaModel = mapper.toPrisma(domainEntity);

        // Then
        expect(convertedPrismaModel.status).toBe(status);
      });
    });
  });
});
