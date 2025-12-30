// src/modules/user-stats/test/user-stats.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Prisma, ExchangeCurrencyCode } from '@repo/database';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UserStatsService } from '../application/user-stats.service';

describe('UserStatsService', () => {
  let service: UserStatsService;
  let mockPrisma: jest.Mocked<PrismaService>;

  // TX(mock TransactionClient)용 타입
  type MockTx = {
    userBalanceStats: {
      update: jest.Mock;
      create: jest.Mock;
    };
  };

  const createMockTx = (): MockTx => ({
    userBalanceStats: {
      update: jest.fn(),
      create: jest.fn(),
    },
  });

  const userId = 'user-123';
  const currency = ExchangeCurrencyCode.USD;

  beforeEach(async () => {
    const mockPrismaProvider = {
      provide: PrismaService,
      useValue: {
        userBalanceStats: {
          findUnique: jest.fn(),
          findMany: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserStatsService, mockPrismaProvider],
    }).compile();

    service = module.get<UserStatsService>(UserStatsService);
    mockPrisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('updateBetWinStats', () => {
    it('기존 레코드가 있으면 update로 업데이트해야 한다', async () => {
      const tx = createMockTx();
      const betAmount = new Prisma.Decimal(100);
      const winAmount = new Prisma.Decimal(50);

      tx.userBalanceStats.update.mockResolvedValue(undefined);

      await service.updateBetWinStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        betAmount,
        winAmount,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalledWith({
        where: { userId_currency: { userId, currency } },
        data: {
          totalBet: { increment: betAmount },
          totalWin: { increment: winAmount },
        },
      });
      expect(tx.userBalanceStats.create).not.toHaveBeenCalled();
    });

    it('기존 레코드가 없으면 P2025 에러 후 create로 생성해야 한다', async () => {
      const tx = createMockTx();
      const betAmount = new Prisma.Decimal(100);
      const winAmount = new Prisma.Decimal(50);

      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: 'test',
        },
      );

      tx.userBalanceStats.update.mockRejectedValue(p2025Error);
      tx.userBalanceStats.create.mockResolvedValue(undefined);

      await service.updateBetWinStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        betAmount,
        winAmount,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalled();
      expect(tx.userBalanceStats.create).toHaveBeenCalledWith({
        data: {
          userId,
          currency,
          totalBet: betAmount,
          totalWin: winAmount,
          totalDeposit: new Prisma.Decimal(0),
          totalWithdraw: new Prisma.Decimal(0),
          totalBonus: new Prisma.Decimal(0),
          totalCompEarned: new Prisma.Decimal(0),
          totalCompUsed: new Prisma.Decimal(0),
          totalSettlementFromBet: new Prisma.Decimal(0),
          totalSettlementFromVip: new Prisma.Decimal(0),
        },
      });
    });
  });

  describe('updateDepositStats', () => {
    it('기존 레코드가 있으면 update로 업데이트해야 한다', async () => {
      const tx = createMockTx();
      const amount = new Prisma.Decimal(200);

      tx.userBalanceStats.update.mockResolvedValue(undefined);

      await service.updateDepositStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        amount,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalledWith({
        where: { userId_currency: { userId, currency } },
        data: { totalDeposit: { increment: amount } },
      });
      expect(tx.userBalanceStats.create).not.toHaveBeenCalled();
    });

    it('기존 레코드가 없으면 P2025 에러 후 create로 생성해야 한다', async () => {
      const tx = createMockTx();
      const amount = new Prisma.Decimal(200);

      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: 'test',
        },
      );

      tx.userBalanceStats.update.mockRejectedValue(p2025Error);
      tx.userBalanceStats.create.mockResolvedValue(undefined);

      await service.updateDepositStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        amount,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalled();
      expect(tx.userBalanceStats.create).toHaveBeenCalled();
    });
  });

  describe('updateWithdrawStats', () => {
    it('기존 레코드가 있으면 update로 업데이트해야 한다', async () => {
      const tx = createMockTx();
      const amount = new Prisma.Decimal(50);

      tx.userBalanceStats.update.mockResolvedValue(undefined);

      await service.updateWithdrawStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        amount,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalledWith({
        where: { userId_currency: { userId, currency } },
        data: { totalWithdraw: { increment: amount } },
      });
      expect(tx.userBalanceStats.create).not.toHaveBeenCalled();
    });

    it('기존 레코드가 없으면 P2025 에러 후 create로 생성해야 한다', async () => {
      const tx = createMockTx();
      const amount = new Prisma.Decimal(50);

      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: 'test',
        },
      );

      tx.userBalanceStats.update.mockRejectedValue(p2025Error);
      tx.userBalanceStats.create.mockResolvedValue(undefined);

      await service.updateWithdrawStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        amount,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalled();
      expect(tx.userBalanceStats.create).toHaveBeenCalled();
    });
  });

  describe('updateBonusStats', () => {
    it('기존 레코드가 있으면 update로 업데이트해야 한다', async () => {
      const tx = createMockTx();
      const amount = new Prisma.Decimal(30);

      tx.userBalanceStats.update.mockResolvedValue(undefined);

      await service.updateBonusStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        amount,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalledWith({
        where: { userId_currency: { userId, currency } },
        data: { totalBonus: { increment: amount } },
      });
      expect(tx.userBalanceStats.create).not.toHaveBeenCalled();
    });

    it('기존 레코드가 없으면 P2025 에러 후 create로 생성해야 한다', async () => {
      const tx = createMockTx();
      const amount = new Prisma.Decimal(30);

      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: 'test',
        },
      );

      tx.userBalanceStats.update.mockRejectedValue(p2025Error);
      tx.userBalanceStats.create.mockResolvedValue(undefined);

      await service.updateBonusStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        amount,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalled();
      expect(tx.userBalanceStats.create).toHaveBeenCalled();
    });
  });

  describe('updateCompEarnedStats', () => {
    it('기존 레코드가 있으면 update로 업데이트해야 한다', async () => {
      const tx = createMockTx();
      const amount = new Prisma.Decimal(10);

      tx.userBalanceStats.update.mockResolvedValue(undefined);

      await service.updateCompEarnedStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        amount,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalledWith({
        where: { userId_currency: { userId, currency } },
        data: { totalCompEarned: { increment: amount } },
      });
      expect(tx.userBalanceStats.create).not.toHaveBeenCalled();
    });

    it('기존 레코드가 없으면 P2025 에러 후 create로 생성해야 한다', async () => {
      const tx = createMockTx();
      const amount = new Prisma.Decimal(10);

      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: 'test',
        },
      );

      tx.userBalanceStats.update.mockRejectedValue(p2025Error);
      tx.userBalanceStats.create.mockResolvedValue(undefined);

      await service.updateCompEarnedStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        amount,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalled();
      expect(tx.userBalanceStats.create).toHaveBeenCalled();
    });
  });

  describe('updateCompUsedStats', () => {
    it('기존 레코드가 있으면 update로 업데이트해야 한다', async () => {
      const tx = createMockTx();
      const amount = new Prisma.Decimal(5);

      tx.userBalanceStats.update.mockResolvedValue(undefined);

      await service.updateCompUsedStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        amount,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalledWith({
        where: { userId_currency: { userId, currency } },
        data: { totalCompUsed: { increment: amount } },
      });
      expect(tx.userBalanceStats.create).not.toHaveBeenCalled();
    });

    it('기존 레코드가 없으면 P2025 에러 후 create로 생성해야 한다', async () => {
      const tx = createMockTx();
      const amount = new Prisma.Decimal(5);

      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: 'test',
        },
      );

      tx.userBalanceStats.update.mockRejectedValue(p2025Error);
      tx.userBalanceStats.create.mockResolvedValue(undefined);

      await service.updateCompUsedStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        amount,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalled();
      expect(tx.userBalanceStats.create).toHaveBeenCalled();
    });
  });

  describe('updateSettlementStats', () => {
    it('기존 레코드가 있으면 update로 업데이트해야 한다', async () => {
      const tx = createMockTx();
      const fromBet = new Prisma.Decimal(40);
      const fromVip = new Prisma.Decimal(20);

      tx.userBalanceStats.update.mockResolvedValue(undefined);

      await service.updateSettlementStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        fromBet,
        fromVip,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalledWith({
        where: { userId_currency: { userId, currency } },
        data: {
          totalSettlementFromBet: { increment: fromBet },
          totalSettlementFromVip: { increment: fromVip },
        },
      });
      expect(tx.userBalanceStats.create).not.toHaveBeenCalled();
    });

    it('기존 레코드가 없으면 P2025 에러 후 create로 생성해야 한다', async () => {
      const tx = createMockTx();
      const fromBet = new Prisma.Decimal(40);
      const fromVip = new Prisma.Decimal(20);

      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: 'test',
        },
      );

      tx.userBalanceStats.update.mockRejectedValue(p2025Error);
      tx.userBalanceStats.create.mockResolvedValue(undefined);

      await service.updateSettlementStats(
        tx as unknown as Prisma.TransactionClient,
        userId,
        currency,
        fromBet,
        fromVip,
      );

      expect(tx.userBalanceStats.update).toHaveBeenCalled();
      expect(tx.userBalanceStats.create).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('특정 통화의 통계를 조회해야 한다', async () => {
      const mockStats = {
        userId,
        currency,
        totalDeposit: new Prisma.Decimal(100),
      } as any;

      (mockPrisma.userBalanceStats.findUnique as jest.Mock).mockResolvedValue(
        mockStats,
      );

      const result = await service.getStats(userId, currency);

      expect(mockPrisma.userBalanceStats.findUnique).toHaveBeenCalledWith({
        where: { userId_currency: { userId, currency } },
      });
      expect(result).toBe(mockStats);
    });
  });

  describe('getAllStats', () => {
    it('사용자의 모든 통화별 통계를 조회해야 한다', async () => {
      const mockStatsList = [
        { userId, currency: ExchangeCurrencyCode.USD },
        { userId, currency: ExchangeCurrencyCode.KRW },
      ] as any[];

      (mockPrisma.userBalanceStats.findMany as jest.Mock).mockResolvedValue(
        mockStatsList,
      );

      const result = await service.getAllStats(userId);

      expect(
        mockPrisma.userBalanceStats.findMany as jest.Mock,
      ).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { currency: 'asc' },
      });
      expect(result).toBe(mockStatsList);
    });
  });
});
