import { SettleArtifactDrawService } from './settle-artifact-draw.service';
import { ArtifactDrawRequest } from '../domain/artifact-draw-request.entity';
import { SolanaBlockhashMissingException } from '../domain/draw.exception';
import { ArtifactDrawStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

describe('SettleArtifactDrawService', () => {
  let service: SettleArtifactDrawService;
  let solanaService: any;
  let drawRequestRepo: any;
  let configRepo: any;
  let catalogRepo: any;
  let inventoryRepo: any;
  let policy: any;
  let universalLogService: any;
  let policyRepo: any;
  let lockService: any;

  beforeEach(() => {
    solanaService = { getBlocks: jest.fn(), getBlockHashBySlot: jest.fn() };
    drawRequestRepo = { findById: jest.fn(), save: jest.fn().mockImplementation(async (r: any) => r) };
    configRepo = { findAll: jest.fn().mockResolvedValue([]) };
    catalogRepo = { findAll: jest.fn().mockResolvedValue([]) };
    inventoryRepo = { save: jest.fn().mockImplementation(async () => ({ id: 999n })) };
    policy = {
      getDrawCount: jest.fn().mockReturnValue(2),
      rollGrade: jest.fn().mockReturnValue({ grade: 'COMMON', remappedRoll: 0.5, rawRoll: 0.5 }),
      selectArtifactFromPool: jest.fn().mockReturnValue({ id: 200n, code: 'C1', grade: 'COMMON' }),
    };
    universalLogService = { execute: jest.fn().mockResolvedValue(undefined) };
    policyRepo = { findPolicy: jest.fn().mockResolvedValue({ getDrawPrice: jest.fn().mockReturnValue(new Prisma.Decimal(5)) }) };
    lockService = { acquireLock: jest.fn().mockResolvedValue(undefined) };

    service = new SettleArtifactDrawService(
      solanaService,
      drawRequestRepo,
      configRepo,
      catalogRepo,
      inventoryRepo,
      policy,
      universalLogService,
      policyRepo,
      lockService,
    );
  });

  it('returns false when request not found or not PENDING', async () => {
    drawRequestRepo.findById.mockResolvedValue(null);
    expect(await service.execute(1n)).toBe(false);

    const req = ArtifactDrawRequest.rehydrate({
      id: 1n,
      userId: 10n,
      targetSlot: 1000n,
      drawType: 'SINGLE' as any,
      paymentType: 'TICKET' as any,
      ticketType: 'ALL',
      currencyCode: null,
      status: ArtifactDrawStatus.SETTLED,
      result: null,
      settledAt: null,
      claimedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    drawRequestRepo.findById.mockResolvedValue(req);
    expect(await service.execute(1n)).toBe(false);
  });

  it('returns false when solana rate limit error occurs', async () => {
    const req = ArtifactDrawRequest.rehydrate({
      id: 1n,
      userId: 10n,
      targetSlot: 1000n,
      drawType: 'SINGLE' as any,
      paymentType: 'TICKET' as any,
      ticketType: 'ALL',
      currencyCode: null,
      status: ArtifactDrawStatus.PENDING,
      result: null,
      settledAt: null,
      claimedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    drawRequestRepo.findById.mockResolvedValue(req);
    policy.getDrawCount.mockReturnValue(2);
    solanaService.getBlocks.mockRejectedValue(new Error('rate limit exceeded'));

    expect(await service.execute(1n)).toBe(false);
  });

  it('returns false when not enough confirmed slots yet', async () => {
    const req = ArtifactDrawRequest.rehydrate({
      id: 1n,
      userId: 10n,
      targetSlot: 1000n,
      drawType: 'SINGLE' as any,
      paymentType: 'TICKET' as any,
      ticketType: 'ALL',
      currencyCode: null,
      status: ArtifactDrawStatus.PENDING,
      result: null,
      settledAt: null,
      claimedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    drawRequestRepo.findById.mockResolvedValue(req);
    policy.getDrawCount.mockReturnValue(3);
    solanaService.getBlocks.mockResolvedValue([1001]);

    expect(await service.execute(1n)).toBe(false);
  });

  it('throws when blockhash is missing for an expected slot', async () => {
    const req = ArtifactDrawRequest.rehydrate({
      id: 1n,
      userId: 10n,
      targetSlot: 1000n,
      drawType: 'SINGLE' as any,
      paymentType: 'TICKET' as any,
      ticketType: 'ALL',
      currencyCode: null,
      status: ArtifactDrawStatus.PENDING,
      result: null,
      settledAt: null,
      claimedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    drawRequestRepo.findById.mockResolvedValue(req);
    policy.getDrawCount.mockReturnValue(2);
    solanaService.getBlocks.mockResolvedValue([1001, 1002, 1003]);
    solanaService.getBlockHashBySlot.mockResolvedValueOnce(null);

    await expect(service.execute(1n)).rejects.toThrow(SolanaBlockhashMissingException);
  });

  it('settles a ticket draw successfully', async () => {
    const req = ArtifactDrawRequest.rehydrate({
      id: 1n,
      userId: 10n,
      targetSlot: 1000n,
      drawType: 'SINGLE' as any,
      paymentType: 'TICKET' as any,
      ticketType: 'ALL',
      currencyCode: null,
      status: ArtifactDrawStatus.PENDING,
      result: null,
      settledAt: null,
      claimedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    drawRequestRepo.findById.mockResolvedValue(req);
    policy.getDrawCount.mockReturnValue(2);

    solanaService.getBlocks.mockResolvedValue([1001, 1002, 1003]);
    solanaService.getBlockHashBySlot.mockResolvedValue('abc123');

    inventoryRepo.save.mockResolvedValue({ id: 101n });

    const result = await service.execute(1n);

    expect(result).toBe(true);
    expect(inventoryRepo.save).toHaveBeenCalledTimes(2);
    expect(drawRequestRepo.save).toHaveBeenCalled();
    expect(universalLogService.execute).toHaveBeenCalled();
  });

  it('settles a currency draw successfully and logs cost', async () => {
    const req = ArtifactDrawRequest.rehydrate({
      id: 2n,
      userId: 20n,
      targetSlot: 2000n,
      drawType: 'SINGLE' as any,
      paymentType: 'CURRENCY' as any,
      ticketType: null,
      currencyCode: 'KRW' as any,
      status: ArtifactDrawStatus.PENDING,
      result: null,
      settledAt: null,
      claimedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    drawRequestRepo.findById.mockResolvedValue(req);
    policy.getDrawCount.mockReturnValue(1);

    solanaService.getBlocks.mockResolvedValue([2001]);
    solanaService.getBlockHashBySlot.mockResolvedValue('def456');

    inventoryRepo.save.mockResolvedValue({ id: 202n });

    policyRepo.findPolicy.mockResolvedValue({ getDrawPrice: jest.fn().mockReturnValue(new Prisma.Decimal(7)) });

    const res = await service.execute(2n);

    expect(res).toBe(true);
    expect(inventoryRepo.save).toHaveBeenCalledTimes(1);
    expect(drawRequestRepo.save).toHaveBeenCalled();
    expect(universalLogService.execute).toHaveBeenCalled();
    const logArg = universalLogService.execute.mock.calls[0][0];
    // currency branch sends action 'artifact.draw.currency'
    expect(logArg.action).toBe('artifact.draw.currency');
    expect(logArg.payload.costAmount).toBe(7);
  });
});
