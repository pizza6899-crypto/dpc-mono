import { ClaimArtifactDrawService } from './claim-artifact-draw.service';
import { SettleArtifactDrawService } from './settle-artifact-draw.service';
import { ArtifactDrawRequest } from '../domain/artifact-draw-request.entity';
import { ArtifactDrawStatus } from '@prisma/client';
import { DrawNotSettledYetException, ArtifactDrawRequestNotFoundException, UnauthorizedDrawClaimException, InvalidDrawStatusException } from '../domain/draw.exception';

describe('ClaimArtifactDrawService', () => {
  let service: ClaimArtifactDrawService;
  let requestContext: any;
  let solanaService: any;
  let drawRequestRepo: any;
  let settleService: any;
  let policy: any;

  beforeEach(() => {
    requestContext = { getUserId: jest.fn().mockReturnValue(100n) };
    solanaService = { getCurrentSlot: jest.fn().mockResolvedValue(1000) };
    drawRequestRepo = { findById: jest.fn(), save: jest.fn().mockImplementation(async (r: any) => r) };
    settleService = { execute: jest.fn() };
    policy = { getDrawCount: jest.fn().mockReturnValue(1) };

    service = new ClaimArtifactDrawService(
      requestContext,
      solanaService,
      drawRequestRepo,
      settleService as unknown as SettleArtifactDrawService,
      policy,
    );
  });

  it('throws when request not found', async () => {
    drawRequestRepo.findById.mockResolvedValue(null);
    await expect(service.execute(1n)).rejects.toThrow(ArtifactDrawRequestNotFoundException);
  });

  it('throws when unauthorized user attempts to claim', async () => {
    const req = ArtifactDrawRequest.rehydrate({
      id: 1n,
      userId: 200n,
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
    await expect(service.execute(1n)).rejects.toThrow(UnauthorizedDrawClaimException);
  });

  it('throws when pending but slot not reached yet', async () => {
    const req = ArtifactDrawRequest.rehydrate({
      id: 1n,
      userId: 100n,
      targetSlot: 2000n,
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
    solanaService.getCurrentSlot.mockResolvedValue(1000);
    await expect(service.execute(1n)).rejects.toThrow(DrawNotSettledYetException);
  });

  it('throws when settleService fails to settle immediately', async () => {
    const req = ArtifactDrawRequest.rehydrate({
      id: 1n,
      userId: 100n,
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
    solanaService.getCurrentSlot.mockResolvedValue(Number(req.targetSlot));
    settleService.execute.mockResolvedValue(false);

    await expect(service.execute(1n)).rejects.toThrow(DrawNotSettledYetException);
  });

  it('finalizes claim when settled', async () => {
    const req = ArtifactDrawRequest.rehydrate({
      id: 1n,
      userId: 100n,
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
    drawRequestRepo.findById.mockResolvedValueOnce(req);

    settleService.execute.mockResolvedValue(true);

    const settled = ArtifactDrawRequest.rehydrate({
      id: 1n,
      userId: 100n,
      targetSlot: 1000n,
      drawType: 'SINGLE' as any,
      paymentType: 'TICKET' as any,
      ticketType: 'ALL',
      currencyCode: null,
      status: ArtifactDrawStatus.SETTLED,
      result: [{ blockhash: 'x', userArtifactId: 1n, artifactCode: 'C', grade: 'COMMON' as any, roll: 0.5, rawRoll: 0.5 }],
      settledAt: new Date(),
      claimedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    drawRequestRepo.findById.mockResolvedValueOnce(settled);
    drawRequestRepo.save.mockResolvedValue(settled);

    const res = await service.execute(1n);
    expect(drawRequestRepo.save).toHaveBeenCalled();
    expect(res.status).toBe(ArtifactDrawStatus.CLAIMED);
  });

  it('throws when invalid status for claim', async () => {
    const req = ArtifactDrawRequest.rehydrate({
      id: 1n,
      userId: 100n,
      targetSlot: 1000n,
      drawType: 'SINGLE' as any,
      paymentType: 'TICKET' as any,
      ticketType: 'ALL',
      currencyCode: null,
      status: ArtifactDrawStatus.CLAIMED,
      result: null,
      settledAt: null,
      claimedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    drawRequestRepo.findById.mockResolvedValue(req);
    await expect(service.execute(1n)).rejects.toThrow(InvalidDrawStatusException);
  });
});
