// src/modules/affiliate/referral/test/referral.integration.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { EnvModule } from 'src/platform/env/env.module';
import { AffiliateReferralModule } from '../referral.module';
import { AffiliateCodeModule } from '../../code/code.module';
import { ActivityLogModule } from 'src/platform/activity-log/activity-log.module';
import { LinkReferralService } from '../application/link-referral.service';
import { FindReferralByIdService } from '../application/find-referral-by-id.service';
import { FindReferralsByAffiliateIdService } from '../application/find-referrals-by-affiliate-id.service';
import { FindReferralBySubUserIdService } from '../application/find-referral-by-sub-user-id.service';
import { AdminReferralService } from '../application/admin-referral.service';
import { ReferralMapper } from '../infrastructure/referral.mapper';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';
import {
  Referral,
  ReferralNotFoundException,
  DuplicateReferralException,
  SelfReferralException,
  ReferralCodeNotFoundException,
  ReferralCodeInactiveException,
  ReferralCodeExpiredException,
} from '../domain';
import { CreateCodeService } from '../../code/application/create-code.service';
import { FindCodeByCodeService } from '../../code/application/find-code-by-code.service';

describe('AffiliateReferralModule Integration', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let linkReferralService: LinkReferralService;
  let findReferralByIdService: FindReferralByIdService;
  let findReferralsByAffiliateIdService: FindReferralsByAffiliateIdService;
  let findReferralBySubUserIdService: FindReferralBySubUserIdService;
  let adminReferralService: AdminReferralService;
  let referralMapper: ReferralMapper;
  let repository: ReferralRepositoryPort;
  let createCodeService: CreateCodeService;
  let findCodeByCodeService: FindCodeByCodeService;

  // 테스트용 사용자 및 코드 데이터
  let affiliateUser: { id: string; email: string | null };
  let subUser1: { id: string; email: string | null };
  let subUser2: { id: string; email: string | null };
  let affiliateCode: { id: string; code: string };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule,
        PrismaModule,
        AffiliateCodeModule,
        ActivityLogModule,
        AffiliateReferralModule,
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    linkReferralService = module.get<LinkReferralService>(LinkReferralService);
    findReferralByIdService = module.get<FindReferralByIdService>(
      FindReferralByIdService,
    );
    findReferralsByAffiliateIdService =
      module.get<FindReferralsByAffiliateIdService>(
        FindReferralsByAffiliateIdService,
      );
    findReferralBySubUserIdService = module.get<FindReferralBySubUserIdService>(
      FindReferralBySubUserIdService,
    );
    adminReferralService =
      module.get<AdminReferralService>(AdminReferralService);
    referralMapper = module.get<ReferralMapper>(ReferralMapper);
    repository = module.get<ReferralRepositoryPort>(REFERRAL_REPOSITORY);
    createCodeService = module.get<CreateCodeService>(CreateCodeService);
    findCodeByCodeService = module.get<FindCodeByCodeService>(
      FindCodeByCodeService,
    );
  });

  beforeEach(async () => {
    // 이전 테스트에서 생성된 데이터 정리 (테스트 이메일 패턴으로 필터링)
    const testEmails = [
      'affiliate@test.com',
      'subuser1@test.com',
      'subuser2@test.com',
      'admin@test.com',
    ];

    // 테스트 이메일로 사용자 찾기
    const testUsers = await prismaService.user.findMany({
      where: { email: { in: testEmails } },
      select: { id: true },
    });

    const testUserIds = testUsers.map((u) => u.id);

    if (testUserIds.length > 0) {
      // 관련 데이터 삭제 (외래키 제약조건을 고려한 순서)
      await prismaService.referral.deleteMany({
        where: {
          OR: [
            { affiliateId: { in: testUserIds } },
            { subUserId: { in: testUserIds } },
          ],
        },
      });
      await prismaService.affiliateCode.deleteMany({
        where: { userId: { in: testUserIds } },
      });
      await prismaService.userBalanceStats.deleteMany({
        where: { userId: { in: testUserIds } },
      });
      await prismaService.userBalance.deleteMany({
        where: { userId: { in: testUserIds } },
      });
      await prismaService.vipHistory.deleteMany({
        where: { userId: { in: testUserIds } },
      });
      await prismaService.vipMembership.deleteMany({
        where: { userId: { in: testUserIds } },
      });
      // User 삭제 (CASCADE로 자동 삭제되는 것들: UserSession, AffiliateCode, Referral 등)
      await prismaService.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
    }

    // 테스트용 사용자 생성 (이미 있으면 삭제 후 재생성)
    const existingAffiliate = await prismaService.user.findUnique({
      where: { email: 'affiliate@test.com' },
    });
    if (existingAffiliate) {
      await prismaService.user.delete({ where: { id: existingAffiliate.id } });
    }

    affiliateUser = await prismaService.user.create({
      data: {
        email: 'affiliate@test.com',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    const existingSubUser1 = await prismaService.user.findUnique({
      where: { email: 'subuser1@test.com' },
    });
    if (existingSubUser1) {
      await prismaService.user.delete({ where: { id: existingSubUser1.id } });
    }

    subUser1 = await prismaService.user.create({
      data: {
        email: 'subuser1@test.com',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    const existingSubUser2 = await prismaService.user.findUnique({
      where: { email: 'subuser2@test.com' },
    });
    if (existingSubUser2) {
      await prismaService.user.delete({ where: { id: existingSubUser2.id } });
    }

    subUser2 = await prismaService.user.create({
      data: {
        email: 'subuser2@test.com',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    // 테스트용 어플리에이트 코드 생성
    affiliateCode = await prismaService.affiliateCode.create({
      data: {
        userId: affiliateUser.id,
        code: 'TESTCODE123',
        campaignName: 'Test Campaign',
        isActive: true,
        isDefault: true,
      },
    });
  });

  afterEach(async () => {
    // 테스트 데이터 정리 (생성한 사용자 ID로 필터링하여 삭제)
    if (affiliateUser?.id) {
      await prismaService.referral.deleteMany({
        where: {
          OR: [
            { affiliateId: affiliateUser.id },
            { subUserId: affiliateUser.id },
          ],
        },
      });
      await prismaService.affiliateCode.deleteMany({
        where: { userId: affiliateUser.id },
      });
      // User 관련 테이블들 삭제 (CASCADE가 없는 것들)
      await prismaService.userBalanceStats.deleteMany({
        where: { userId: affiliateUser.id },
      });
      await prismaService.userBalance.deleteMany({
        where: { userId: affiliateUser.id },
      });
      await prismaService.vipHistory.deleteMany({
        where: { userId: affiliateUser.id },
      });
      await prismaService.vipMembership.deleteMany({
        where: { userId: affiliateUser.id },
      });
      await prismaService.user.deleteMany({
        where: { id: affiliateUser.id },
      });
    }
    if (subUser1?.id) {
      await prismaService.referral.deleteMany({
        where: { subUserId: subUser1.id },
      });
      await prismaService.userBalanceStats.deleteMany({
        where: { userId: subUser1.id },
      });
      await prismaService.userBalance.deleteMany({
        where: { userId: subUser1.id },
      });
      await prismaService.vipHistory.deleteMany({
        where: { userId: subUser1.id },
      });
      await prismaService.vipMembership.deleteMany({
        where: { userId: subUser1.id },
      });
      await prismaService.user.deleteMany({
        where: { id: subUser1.id },
      });
    }
    if (subUser2?.id) {
      await prismaService.referral.deleteMany({
        where: { subUserId: subUser2.id },
      });
      await prismaService.userBalanceStats.deleteMany({
        where: { userId: subUser2.id },
      });
      await prismaService.userBalance.deleteMany({
        where: { userId: subUser2.id },
      });
      await prismaService.vipHistory.deleteMany({
        where: { userId: subUser2.id },
      });
      await prismaService.vipMembership.deleteMany({
        where: { userId: subUser2.id },
      });
      await prismaService.user.deleteMany({
        where: { id: subUser2.id },
      });
    }
  });

  afterAll(async () => {
    await module.close();
  });

  describe('LinkReferralService', () => {
    it('should create a referral relationship successfully', async () => {
      const referral = await linkReferralService.execute({
        subUserId: subUser1.id,
        referralCode: 'TESTCODE123',
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'fingerprint123',
        userAgent: 'Mozilla/5.0',
      });

      expect(referral).toBeDefined();
      expect(referral.affiliateId).toBe(affiliateUser.id);
      expect(referral.subUserId).toBe(subUser1.id);
      expect(referral.codeId).toBe(affiliateCode.id);
      expect(referral.ipAddress).toBe('192.168.1.1');
      expect(referral.deviceFingerprint).toBe('fingerprint123');
      expect(referral.userAgent).toBe('Mozilla/5.0');
      expect(referral.hasTrackingData()).toBe(true);

      // DB에서 확인
      const dbReferral = await prismaService.referral.findUnique({
        where: { id: referral.id },
      });
      expect(dbReferral).toBeDefined();
      expect(dbReferral?.affiliateId).toBe(affiliateUser.id);
      expect(dbReferral?.subUserId).toBe(subUser1.id);
    });

    it('should throw error when referral code not found', async () => {
      await expect(
        linkReferralService.execute({
          subUserId: subUser1.id,
          referralCode: 'NOTEXIST',
        }),
      ).rejects.toThrow(ReferralCodeNotFoundException);
    });

    it('should throw error when trying self-referral', async () => {
      await expect(
        linkReferralService.execute({
          subUserId: affiliateUser.id, // 자기 자신을 추천
          referralCode: 'TESTCODE123',
        }),
      ).rejects.toThrow(SelfReferralException);
    });

    it('should throw error when code is inactive', async () => {
      // 코드 비활성화
      await prismaService.affiliateCode.update({
        where: { id: affiliateCode.id },
        data: { isActive: false },
      });

      // findByCode는 활성화된 코드만 반환하므로, 비활성화된 코드는 찾을 수 없음
      // 따라서 ReferralCodeNotFoundException이 발생함
      await expect(
        linkReferralService.execute({
          subUserId: subUser1.id,
          referralCode: 'TESTCODE123',
        }),
      ).rejects.toThrow(ReferralCodeNotFoundException);
    });

    it('should throw error when code is expired', async () => {
      // 코드 만료 설정
      await prismaService.affiliateCode.update({
        where: { id: affiliateCode.id },
        data: { expiresAt: new Date('2020-01-01') },
      });

      await expect(
        linkReferralService.execute({
          subUserId: subUser1.id,
          referralCode: 'TESTCODE123',
        }),
      ).rejects.toThrow(ReferralCodeExpiredException);
    });

    it('should throw error when duplicate referral exists', async () => {
      // 첫 번째 레퍼럴 생성
      await linkReferralService.execute({
        subUserId: subUser1.id,
        referralCode: 'TESTCODE123',
      });

      // 동일한 사용자로 다시 레퍼럴 생성 시도
      await expect(
        linkReferralService.execute({
          subUserId: subUser1.id,
          referralCode: 'TESTCODE123',
        }),
      ).rejects.toThrow(DuplicateReferralException);
    });

    it('should create referral without tracking data', async () => {
      const referral = await linkReferralService.execute({
        subUserId: subUser1.id,
        referralCode: 'TESTCODE123',
      });

      expect(referral).toBeDefined();
      expect(referral.ipAddress).toBeNull();
      expect(referral.deviceFingerprint).toBeNull();
      expect(referral.userAgent).toBeNull();
      expect(referral.hasTrackingData()).toBe(false);
    });
  });

  describe('FindReferralByIdService', () => {
    it('should find referral by id', async () => {
      // 레퍼럴 생성
      const createdReferral = await linkReferralService.execute({
        subUserId: subUser1.id,
        referralCode: 'TESTCODE123',
      });

      const foundReferral = await findReferralByIdService.execute({
        id: createdReferral.id,
      });

      expect(foundReferral).toBeDefined();
      expect(foundReferral.id).toBe(createdReferral.id);
      expect(foundReferral.affiliateId).toBe(affiliateUser.id);
      expect(foundReferral.subUserId).toBe(subUser1.id);
    });

    it('should throw error when referral not found', async () => {
      await expect(
        findReferralByIdService.execute({
          id: 'non-existent-id',
        }),
      ).rejects.toThrow(ReferralNotFoundException);
    });
  });

  describe('FindReferralsByAffiliateIdService', () => {
    it('should find all referrals for an affiliate', async () => {
      // 여러 레퍼럴 생성
      await linkReferralService.execute({
        subUserId: subUser1.id,
        referralCode: 'TESTCODE123',
      });

      // 두 번째 코드 생성
      const code2 = await prismaService.affiliateCode.create({
        data: {
          userId: affiliateUser.id,
          code: 'TESTCODE456',
          campaignName: 'Test Campaign 2',
          isActive: true,
        },
      });

      await linkReferralService.execute({
        subUserId: subUser2.id,
        referralCode: 'TESTCODE456',
      });

      const referrals = await findReferralsByAffiliateIdService.execute({
        affiliateId: affiliateUser.id,
      });

      expect(referrals).toHaveLength(2);
      expect(referrals[0].affiliateId).toBe(affiliateUser.id);
      expect(referrals[1].affiliateId).toBe(affiliateUser.id);
    });

    it('should return empty array when no referrals exist', async () => {
      const referrals = await findReferralsByAffiliateIdService.execute({
        affiliateId: affiliateUser.id,
      });

      expect(referrals).toHaveLength(0);
    });
  });

  describe('FindReferralBySubUserIdService', () => {
    it('should find referral by sub user id', async () => {
      // 레퍼럴 생성
      const createdReferral = await linkReferralService.execute({
        subUserId: subUser1.id,
        referralCode: 'TESTCODE123',
      });

      const foundReferral = await findReferralBySubUserIdService.execute({
        subUserId: subUser1.id,
      });

      expect(foundReferral).toBeDefined();
      expect(foundReferral?.id).toBe(createdReferral.id);
      expect(foundReferral?.subUserId).toBe(subUser1.id);
    });

    it('should return null when referral not found', async () => {
      const foundReferral = await findReferralBySubUserIdService.execute({
        subUserId: subUser1.id,
      });

      expect(foundReferral).toBeNull();
    });
  });

  describe('AdminReferralService', () => {
    let adminUser: { id: string; email: string | null };

    beforeEach(async () => {
      adminUser = await prismaService.user.create({
        data: {
          email: 'admin@test.com',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      // 테스트용 레퍼럴 생성
      await linkReferralService.execute({
        subUserId: subUser1.id,
        referralCode: 'TESTCODE123',
        ipAddress: '192.168.1.1',
      });
    });

    it('should get referrals list with pagination', async () => {
      const result = await adminReferralService.getReferrals(
        {
          page: 1,
          limit: 10,
        },
        adminUser.id,
        {
          ip: '127.0.0.1',
          userAgent: 'test',
          country: 'KR',
          city: 'Seoul',
          referer: '',
          acceptLanguage: 'ko',
          fingerprint: 'test-fingerprint',
          protocol: 'http',
          method: 'GET',
          path: '/test',
          timestamp: new Date(),
          isMobile: false,
          browser: 'test',
          os: 'test',
          timezone: 'Asia/Seoul',
          isp: 'test',
          asn: 'test',
          threat: 'low',
          bot: false,
        },
      );

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.data[0].affiliateId).toBe(affiliateUser.id);
      expect(result.data[0].subUserId).toBe(subUser1.id);
    });

    it('should filter referrals by affiliateId', async () => {
      const result = await adminReferralService.getReferrals(
        {
          page: 1,
          limit: 10,
          affiliateId: affiliateUser.id,
        },
        adminUser.id,
        {
          ip: '127.0.0.1',
          userAgent: 'test',
          country: 'KR',
          city: 'Seoul',
          referer: '',
          acceptLanguage: 'ko',
          fingerprint: 'test-fingerprint',
          protocol: 'http',
          method: 'GET',
          path: '/test',
          timestamp: new Date(),
          isMobile: false,
          browser: 'test',
          os: 'test',
          timezone: 'Asia/Seoul',
          isp: 'test',
          asn: 'test',
          threat: 'low',
          bot: false,
        },
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].affiliateId).toBe(affiliateUser.id);
    });

    it('should filter referrals by subUserId', async () => {
      const result = await adminReferralService.getReferrals(
        {
          page: 1,
          limit: 10,
          subUserId: subUser1.id,
        },
        adminUser.id,
        {
          ip: '127.0.0.1',
          userAgent: 'test',
          country: 'KR',
          city: 'Seoul',
          referer: '',
          acceptLanguage: 'ko',
          fingerprint: 'test-fingerprint',
          protocol: 'http',
          method: 'GET',
          path: '/test',
          timestamp: new Date(),
          isMobile: false,
          browser: 'test',
          os: 'test',
          timezone: 'Asia/Seoul',
          isp: 'test',
          asn: 'test',
          threat: 'low',
          bot: false,
        },
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].subUserId).toBe(subUser1.id);
    });

    it('should get referral by id', async () => {
      const referrals = await prismaService.referral.findMany({});
      const referralId = referrals[0].id;

      const result = await adminReferralService.getReferralById(
        referralId,
        adminUser.id,
        {
          ip: '127.0.0.1',
          userAgent: 'test',
          country: 'KR',
          city: 'Seoul',
          referer: '',
          acceptLanguage: 'ko',
          fingerprint: 'test-fingerprint',
          protocol: 'http',
          method: 'GET',
          path: '/test',
          timestamp: new Date(),
          isMobile: false,
          browser: 'test',
          os: 'test',
          timezone: 'Asia/Seoul',
          isp: 'test',
          asn: 'test',
          threat: 'low',
          bot: false,
        },
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(referralId);
      expect(result.affiliateId).toBe(affiliateUser.id);
      expect(result.subUserId).toBe(subUser1.id);
    });

    it('should throw error when referral not found', async () => {
      await expect(
        adminReferralService.getReferralById('non-existent-id', adminUser.id, {
          ip: '127.0.0.1',
          userAgent: 'test',
          country: 'KR',
          city: 'Seoul',
          referer: '',
          acceptLanguage: 'ko',
          fingerprint: 'test-fingerprint',
          protocol: 'http',
          method: 'GET',
          path: '/test',
          timestamp: new Date(),
          isMobile: false,
          browser: 'test',
          os: 'test',
          timezone: 'Asia/Seoul',
          isp: 'test',
          asn: 'test',
          threat: 'low',
          bot: false,
        }),
      ).rejects.toThrow(ReferralNotFoundException);
    });
  });

  describe('ReferralMapper', () => {
    it('should map Prisma model to domain entity', () => {
      const prismaModel = {
        id: 'test-id',
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser1.id,
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'fingerprint123',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const domainEntity = referralMapper.toDomain(prismaModel);

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
    });

    it('should map domain entity to Prisma model', () => {
      const domainEntity = Referral.fromPersistence({
        id: 'test-id',
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser1.id,
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'fingerprint123',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const prismaModel = referralMapper.toPrisma(domainEntity);

      expect(prismaModel.id).toBe(domainEntity.id);
      expect(prismaModel.affiliateId).toBe(domainEntity.affiliateId);
      expect(prismaModel.codeId).toBe(domainEntity.codeId);
      expect(prismaModel.subUserId).toBe(domainEntity.subUserId);
      expect(prismaModel.ipAddress).toBe(domainEntity.ipAddress);
      expect(prismaModel.deviceFingerprint).toBe(
        domainEntity.deviceFingerprint,
      );
      expect(prismaModel.userAgent).toBe(domainEntity.userAgent);
    });

    it('should handle null values in tracking data', () => {
      const prismaModel = {
        id: 'test-id',
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser1.id,
        ipAddress: null,
        deviceFingerprint: null,
        userAgent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const domainEntity = referralMapper.toDomain(prismaModel);

      expect(domainEntity.ipAddress).toBeNull();
      expect(domainEntity.deviceFingerprint).toBeNull();
      expect(domainEntity.userAgent).toBeNull();
      expect(domainEntity.hasTrackingData()).toBe(false);
    });
  });

  describe('ReferralRepository Integration', () => {
    it('should create referral through repository', async () => {
      const referral = await repository.create({
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser1.id,
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'fingerprint123',
        userAgent: 'Mozilla/5.0',
      });

      expect(referral).toBeInstanceOf(Referral);
      expect(referral.affiliateId).toBe(affiliateUser.id);
      expect(referral.subUserId).toBe(subUser1.id);

      // DB에서 확인
      const dbReferral = await prismaService.referral.findUnique({
        where: { id: referral.id },
      });
      expect(dbReferral).toBeDefined();
    });

    it('should find referral by id through repository', async () => {
      const created = await repository.create({
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser1.id,
      });

      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return null when referral not found by id', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should get referral by id (throws if not found)', async () => {
      const created = await repository.create({
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser1.id,
      });

      const found = await repository.getById(created.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    it('should throw error when getting non-existent referral', async () => {
      await expect(repository.getById('non-existent-id')).rejects.toThrow(
        ReferralNotFoundException,
      );
    });

    it('should find referrals by affiliate id', async () => {
      await repository.create({
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser1.id,
      });

      await repository.create({
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser2.id,
      });

      const referrals = await repository.findByAffiliateId(affiliateUser.id);

      expect(referrals).toHaveLength(2);
      expect(referrals[0].affiliateId).toBe(affiliateUser.id);
      expect(referrals[1].affiliateId).toBe(affiliateUser.id);
    });

    it('should find referral by sub user id', async () => {
      const created = await repository.create({
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser1.id,
      });

      const found = await repository.findBySubUserId(subUser1.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.subUserId).toBe(subUser1.id);
    });

    it('should return null when referral not found by sub user id', async () => {
      const found = await repository.findBySubUserId(subUser1.id);
      expect(found).toBeNull();
    });

    it('should find referrals by code id', async () => {
      // 같은 코드로 여러 레퍼럴 생성
      await repository.create({
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser1.id,
      });

      await repository.create({
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser2.id,
      });

      const referrals = await repository.findByCodeId(affiliateCode.id);

      expect(referrals).toHaveLength(2);
      expect(referrals[0].codeId).toBe(affiliateCode.id);
      expect(referrals[1].codeId).toBe(affiliateCode.id);
      // 최신순 정렬 확인
      expect(referrals[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        referrals[1].createdAt.getTime(),
      );
    });

    it('should return empty array when no referrals found by code id', async () => {
      const referrals = await repository.findByCodeId('non-existent-code-id');
      expect(referrals).toHaveLength(0);
    });

    it('should find referral by affiliate and sub user', async () => {
      const created = await repository.create({
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser1.id,
      });

      const found = await repository.findByAffiliateAndSubUser(
        affiliateUser.id,
        subUser1.id,
      );

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.affiliateId).toBe(affiliateUser.id);
      expect(found?.subUserId).toBe(subUser1.id);
    });

    it('should return null when referral not found by affiliate and sub user', async () => {
      const found = await repository.findByAffiliateAndSubUser(
        affiliateUser.id,
        subUser1.id,
      );
      expect(found).toBeNull();
    });

    it('should count referrals by affiliate id', async () => {
      await repository.create({
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser1.id,
      });

      await repository.create({
        affiliateId: affiliateUser.id,
        codeId: affiliateCode.id,
        subUserId: subUser2.id,
      });

      const count = await repository.countByAffiliateId(affiliateUser.id);

      expect(count).toBe(2);
    });
  });

  describe('Module Integration', () => {
    it('should have all services registered', () => {
      expect(linkReferralService).toBeDefined();
      expect(findReferralByIdService).toBeDefined();
      expect(findReferralsByAffiliateIdService).toBeDefined();
      expect(findReferralBySubUserIdService).toBeDefined();
      expect(adminReferralService).toBeDefined();
      expect(referralMapper).toBeDefined();
      expect(repository).toBeDefined();
    });

    it('should have repository injected correctly', () => {
      const injectedRepository =
        module.get<ReferralRepositoryPort>(REFERRAL_REPOSITORY);
      expect(injectedRepository).toBeDefined();
      expect(injectedRepository).toBe(repository);
    });
  });
});
