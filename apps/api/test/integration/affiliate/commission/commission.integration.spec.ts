// test/integration/affiliate/commission/commission.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';
import { AffiliateReferralModule } from 'src/modules/affiliate/referral/referral.module';
import { AffiliateCommissionModule } from 'src/modules/affiliate/commission/commission.module';
import {
  ExchangeCurrencyCode,
  CommissionStatus,
  AffiliateTierLevel,
  Prisma,
} from '@repo/database';;
import { AffiliateWallet } from 'src/modules/affiliate/commission/domain';
import { AFFILIATE_WALLET_REPOSITORY } from 'src/modules/affiliate/commission/ports/out/affiliate-wallet.repository.token';
import { AFFILIATE_COMMISSION_REPOSITORY } from 'src/modules/affiliate/commission/ports/out/affiliate-commission.repository.token';
import { AFFILIATE_TIER_REPOSITORY } from 'src/modules/affiliate/commission/ports/out/affiliate-tier.repository.token';
import type { AffiliateWalletRepositoryPort } from 'src/modules/affiliate/commission/ports/out/affiliate-wallet.repository.port';
import type { AffiliateCommissionRepositoryPort } from 'src/modules/affiliate/commission/ports/out/affiliate-commission.repository.port';
import type { AffiliateTierRepositoryPort } from 'src/modules/affiliate/commission/ports/out/affiliate-tier.repository.port';
import { IdUtil } from 'src/utils/id.util';
import { FindCommissionsService } from 'src/modules/affiliate/commission/application/find-commissions.service';
import { FindCommissionByIdService } from 'src/modules/affiliate/commission/application/find-commission-by-id.service';
import { GetWalletBalanceService } from 'src/modules/affiliate/commission/application/get-wallet-balance.service';
import { GetCommissionRateService } from 'src/modules/affiliate/commission/application/get-commission-rate.service';
import { WithdrawCommissionService } from 'src/modules/affiliate/commission/application/withdraw-commission.service';
import { SetCustomRateService } from 'src/modules/affiliate/commission/application/set-custom-rate.service';
import { ResetCustomRateService } from 'src/modules/affiliate/commission/application/reset-custom-rate.service';
import { CalculateCommissionService } from 'src/modules/affiliate/commission/application/calculate-commission.service';
import { AccumulateCommissionService } from 'src/modules/affiliate/commission/application/accumulate-commission.service';
import { SettleDailyCommissionsService } from 'src/modules/affiliate/commission/application/settle-daily-commissions.service';
import { ClsService } from 'nestjs-cls';

describe('AffiliateCommissionModule Integration', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let clsService: ClsService;
  let walletRepository: AffiliateWalletRepositoryPort;
  let commissionRepository: AffiliateCommissionRepositoryPort;
  let tierRepository: AffiliateTierRepositoryPort;

  const testAffiliateId = 'test-affiliate-commission-integration';
  const testSubUserId = 'test-sub-user-commission-integration';
  const testCurrency = ExchangeCurrencyCode.USD;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule,
        PrismaModule,
        ActivityLogModule,
        AffiliateReferralModule,
        AffiliateCommissionModule,
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    clsService = module.get<ClsService>(ClsService);
    walletRepository = module.get<AffiliateWalletRepositoryPort>(
      AFFILIATE_WALLET_REPOSITORY,
    );
    commissionRepository = module.get<AffiliateCommissionRepositoryPort>(
      AFFILIATE_COMMISSION_REPOSITORY,
    );
    tierRepository = module.get<AffiliateTierRepositoryPort>(
      AFFILIATE_TIER_REPOSITORY,
    );
  });

  beforeEach(async () => {
    // 테스트 데이터 정리
    await prismaService.affiliateCommission.deleteMany({
      where: {
        OR: [{ affiliateId: testAffiliateId }, { subUserId: testSubUserId }],
      },
    });

    await prismaService.affiliateWallet.deleteMany({
      where: { affiliateId: testAffiliateId },
    });

    await prismaService.affiliateTier.deleteMany({
      where: { affiliateId: testAffiliateId },
    });
  });

  afterAll(async () => {
    // 최종 정리
    await prismaService.affiliateCommission.deleteMany({
      where: {
        OR: [{ affiliateId: testAffiliateId }, { subUserId: testSubUserId }],
      },
    });

    await prismaService.affiliateWallet.deleteMany({
      where: { affiliateId: testAffiliateId },
    });

    await prismaService.affiliateTier.deleteMany({
      where: { affiliateId: testAffiliateId },
    });

    await module.close();
  });

  describe('AffiliateWalletRepository Integration', () => {
    it('월렛을 생성하고 조회한다', async () => {
      // Given
      const wallet = AffiliateWallet.create({
        affiliateId: testAffiliateId,
        currency: testCurrency,
        availableBalance: new Prisma.Decimal('1000.00'),
        pendingBalance: new Prisma.Decimal('500.00'),
        totalEarned: new Prisma.Decimal('1500.00'),
      });

      // When
      const created = await testWithTransaction(async () => {
        return await walletRepository.upsert(wallet);
      });

      // Then
      expect(created.affiliateId).toBe(testAffiliateId);
      expect(created.currency).toBe(testCurrency);
      expect(created.availableBalance.toString()).toBe('1000');
      expect(created.pendingBalance.toString()).toBe('500');
      expect(created.totalEarned.toString()).toBe('1500');

      // DB에서 직접 조회하여 확인
      const found = await testWithTransaction(async () => {
        return await walletRepository.findByAffiliateIdAndCurrency(
          testAffiliateId,
          testCurrency,
        );
      });
      expect(found).not.toBeNull();
      expect(found?.affiliateId).toBe(testAffiliateId);
      expect(found?.currency).toBe(testCurrency);
    });

    it('월렛을 업데이트한다', async () => {
      // Given
      const wallet = AffiliateWallet.create({
        affiliateId: testAffiliateId,
        currency: testCurrency,
        availableBalance: new Prisma.Decimal('1000.00'),
        pendingBalance: new Prisma.Decimal('500.00'),
        totalEarned: new Prisma.Decimal('1500.00'),
      });

      const created = await testWithTransaction(async () => {
        return await walletRepository.upsert(wallet);
      });

      // When
      created.addPendingCommission(new Prisma.Decimal('200.00'));
      const updated = await testWithTransaction(async () => {
        return await walletRepository.upsert(created);
      });

      // Then
      expect(updated.pendingBalance.toString()).toBe('700');
      expect(updated.totalEarned.toString()).toBe('1700');
    });

    it('월렛이 없으면 null을 반환한다', async () => {
      // When
      const found = await testWithTransaction(async () => {
        return await walletRepository.findByAffiliateIdAndCurrency(
          'non-existent-affiliate',
          testCurrency,
        );
      });

      // Then
      expect(found).toBeNull();
    });

    it('월렛이 없으면 예외를 던진다', async () => {
      // When & Then
      await expect(
        testWithTransaction(async () => {
          return await walletRepository.getByAffiliateIdAndCurrency(
            'non-existent-affiliate',
            testCurrency,
          );
        }),
      ).rejects.toThrow();
    });
  });

  describe('AffiliateCommissionRepository Integration', () => {
    it('커미션을 생성하고 조회한다', async () => {
      // Given
      const commission = await createTestCommission();

      // When
      const found = await testWithTransaction(async () => {
        return await commissionRepository.findByUid(commission.uid);
      });

      // Then
      expect(found).not.toBeNull();
      expect(found?.uid).toBe(commission.uid);
      expect(found?.affiliateId).toBe(testAffiliateId);
      expect(found?.commission.toString()).toBe('100');
    });

    it('UID로 커미션을 조회한다', async () => {
      // Given
      const commission = await createTestCommission();

      // When
      const found = await testWithTransaction(async () => {
        return await commissionRepository.getByUid(commission.uid);
      });

      // Then
      expect(found.uid).toBe(commission.uid);
      expect(found.affiliateId).toBe(testAffiliateId);
    });

    it('ID로 커미션을 조회한다', async () => {
      // Given
      const commission = await createTestCommission();

      // When
      const found = await testWithTransaction(async () => {
        return await commissionRepository.getById(commission.id!);
      });

      // Then
      expect(found.id).toEqual(commission.id);
      expect(found.uid).toBe(commission.uid);
    });

    it('PENDING 커미션 목록을 조회한다', async () => {
      // Given
      await createTestCommission({
        status: CommissionStatus.PENDING,
      });
      await createTestCommission({
        status: CommissionStatus.PENDING,
      });
      await createTestCommission({
        status: CommissionStatus.AVAILABLE,
      });

      // When
      const pending = await testWithTransaction(async () => {
        return await commissionRepository.findPendingByAffiliateId(
          testAffiliateId,
          testCurrency,
        );
      });

      // Then
      expect(pending.length).toBe(2);
      expect(pending.every((c) => c.status === CommissionStatus.PENDING)).toBe(
        true,
      );
    });

    it('PENDING 커미션을 정산 처리한다', async () => {
      // Given
      const commission1 = await createTestCommission({
        status: CommissionStatus.PENDING,
      });
      const commission2 = await createTestCommission({
        status: CommissionStatus.PENDING,
      });

      const settlementDate = new Date();

      // When
      const settledCount = await testWithTransaction(async () => {
        return await commissionRepository.settlePendingCommissions(
          [commission1.id!, commission2.id!],
          settlementDate,
        );
      });

      // Then
      expect(settledCount).toBe(2);

      const found1 = await testWithTransaction(async () => {
        return await commissionRepository.getById(commission1.id!);
      });
      const found2 = await testWithTransaction(async () => {
        return await commissionRepository.getById(commission2.id!);
      });

      expect(found1.status).toBe(CommissionStatus.AVAILABLE);
      expect(found2.status).toBe(CommissionStatus.AVAILABLE);
      expect(found1.settlementDate).toEqual(settlementDate);
      expect(found2.settlementDate).toEqual(settlementDate);
    });
  });

  describe('AffiliateTierRepository Integration', () => {
    it('티어를 생성하고 조회한다', async () => {
      // Given
      await createTestTier();

      // When
      const found = await testWithTransaction(async () => {
        return await tierRepository.findByAffiliateId(testAffiliateId);
      });

      // Then
      expect(found).not.toBeNull();
      expect(found?.affiliateId).toBe(testAffiliateId);
      expect(found?.tier).toBe(AffiliateTierLevel.BRONZE);
      expect(found?.baseRate.toString()).toBe('0.005');
    });

    it('티어를 업데이트한다', async () => {
      // Given
      await createTestTier();
      const tier = await testWithTransaction(async () => {
        return await tierRepository.getByAffiliateId(testAffiliateId);
      });

      // When
      tier.setCustomRate(new Prisma.Decimal('0.01'), 'admin-123');
      const updated = await testWithTransaction(async () => {
        return await tierRepository.upsert(tier);
      });

      // Then
      expect(updated.customRate?.toString()).toBe('0.01');
      expect(updated.isCustomRate).toBe(true);
      expect(updated.customRateSetBy).toBe('admin-123');
    });

    it('월간 베팅 금액을 업데이트한다', async () => {
      // Given
      await createTestTier();
      const tier = await testWithTransaction(async () => {
        return await tierRepository.getByAffiliateId(testAffiliateId);
      });

      // When
      tier.updateMonthlyWagerAmount(new Prisma.Decimal('50000.00'));
      const updated = await testWithTransaction(async () => {
        return await tierRepository.upsert(tier);
      });

      // Then
      expect(updated.monthlyWagerAmount.toString()).toBe('50000');
    });
  });

  describe('Module Integration', () => {
    it('모든 서비스가 올바르게 주입된다', async () => {
      // Given & When
      const findCommissionsService = module.get<FindCommissionsService>(
        FindCommissionsService,
      );
      const findCommissionByIdService = module.get<FindCommissionByIdService>(
        FindCommissionByIdService,
      );
      const getWalletBalanceService = module.get<GetWalletBalanceService>(
        GetWalletBalanceService,
      );
      const getCommissionRateService = module.get<GetCommissionRateService>(
        GetCommissionRateService,
      );
      const withdrawCommissionService = module.get<WithdrawCommissionService>(
        WithdrawCommissionService,
      );
      const setCustomRateService =
        module.get<SetCustomRateService>(SetCustomRateService);
      const resetCustomRateService = module.get<ResetCustomRateService>(
        ResetCustomRateService,
      );
      const calculateCommissionService = module.get<CalculateCommissionService>(
        CalculateCommissionService,
      );
      const accumulateCommissionService =
        module.get<AccumulateCommissionService>(AccumulateCommissionService);
      const settleDailyCommissionsService =
        module.get<SettleDailyCommissionsService>(
          SettleDailyCommissionsService,
        );

      // Then
      expect(findCommissionsService).toBeDefined();
      expect(findCommissionByIdService).toBeDefined();
      expect(getWalletBalanceService).toBeDefined();
      expect(getCommissionRateService).toBeDefined();
      expect(withdrawCommissionService).toBeDefined();
      expect(setCustomRateService).toBeDefined();
      expect(resetCustomRateService).toBeDefined();
      expect(calculateCommissionService).toBeDefined();
      expect(accumulateCommissionService).toBeDefined();
      expect(settleDailyCommissionsService).toBeDefined();
    });

    it('Repository가 올바르게 바인딩된다', async () => {
      // Given & When
      const walletRepo = module.get<AffiliateWalletRepositoryPort>(
        AFFILIATE_WALLET_REPOSITORY,
      );
      const commissionRepo = module.get<AffiliateCommissionRepositoryPort>(
        AFFILIATE_COMMISSION_REPOSITORY,
      );
      const tierRepo = module.get<AffiliateTierRepositoryPort>(
        AFFILIATE_TIER_REPOSITORY,
      );

      // Then
      expect(walletRepo).toBeDefined();
      expect(commissionRepo).toBeDefined();
      expect(tierRepo).toBeDefined();
    });
  });

  // Helper functions
  /**
   * Repository 메서드를 트랜잭션 컨텍스트에서 실행하는 헬퍼 함수
   */
  async function testWithTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return await clsService.run(async () => {
      return await fn();
    });
  }

  async function createTestCommission(overrides?: {
    status?: CommissionStatus;
    commission?: Prisma.Decimal;
  }) {
    const commission = await prismaService.affiliateCommission.create({
      data: {
        uid: IdUtil.generateUid(),
        affiliateId: testAffiliateId,
        subUserId: testSubUserId,
        gameRoundId: BigInt(123),
        wagerAmount: new Prisma.Decimal('10000.00'),
        winAmount: new Prisma.Decimal('5000.00'),
        commission: overrides?.commission || new Prisma.Decimal('100.00'),
        rateApplied: new Prisma.Decimal('0.01'),
        currency: testCurrency,
        status: overrides?.status || CommissionStatus.PENDING,
        gameCategory: 'SLOTS',
      },
    });

    return commission;
  }

  async function createTestTier() {
    const tier = await prismaService.affiliateTier.create({
      data: {
        uid: IdUtil.generateUid(),
        affiliateId: testAffiliateId,
        tier: AffiliateTierLevel.BRONZE,
        baseRate: new Prisma.Decimal('0.005'),
        customRate: null,
        isCustomRate: false,
        monthlyWagerAmount: new Prisma.Decimal('0'),
        customRateSetBy: null,
        customRateSetAt: null,
      },
    });

    return tier;
  }
});
