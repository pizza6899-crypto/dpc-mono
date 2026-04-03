import { RequestArtifactDrawService } from './request-artifact-draw.service';
import { ArtifactDrawRequest } from '../domain/artifact-draw-request.entity';
import { ArtifactStatusNotFoundException } from '../../status/domain/status.exception';
import { ArtifactPolicyNotFoundException } from '../../master/domain/master.exception';
import { ArtifactDrawPriceNotFoundException, CurrencyCodeRequiredException } from '../domain/draw.exception';
import { ArtifactDrawPaymentType, ArtifactDrawType, Prisma } from '@prisma/client';

describe('RequestArtifactDrawService', () => {
  let service: RequestArtifactDrawService;
  let requestContext: any;
  let solanaService: any;
  let lockService: any;
  let userStatusRepo: any;
  let policyRepo: any;
  let drawRequestRepo: any;
  let wageringBetService: any;
  let exchangeRateService: any;

  beforeEach(() => {
    requestContext = { getUserId: jest.fn().mockReturnValue(100n), getPlayCurrency: jest.fn().mockReturnValue('KRW') };
    solanaService = { getCurrentSlot: jest.fn().mockResolvedValue(1000) };
    lockService = { acquireLock: jest.fn().mockResolvedValue(undefined) };

    userStatusRepo = {
      findByUserId: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    policyRepo = { findPolicy: jest.fn() };
    drawRequestRepo = { save: jest.fn().mockImplementation(async (r: ArtifactDrawRequest) => r), findById: jest.fn() };
    wageringBetService = { execute: jest.fn().mockResolvedValue(undefined) };
    exchangeRateService = { getRate: jest.fn().mockResolvedValue(new Prisma.Decimal(1)) };

    service = new RequestArtifactDrawService(
      requestContext,
      solanaService,
      lockService,
      userStatusRepo,
      policyRepo,
      drawRequestRepo,
      wageringBetService,
      exchangeRateService,
    );
  });

  it('throws when user status not found', async () => {
    userStatusRepo.findByUserId.mockResolvedValue(null);

    await expect(
      service.execute({ drawType: ArtifactDrawType.SINGLE as any, paymentType: ArtifactDrawPaymentType.TICKET as any })
    ).rejects.toThrow(ArtifactStatusNotFoundException);
  });

  it('throws when currency code is missing for currency payment', async () => {
    userStatusRepo.findByUserId.mockResolvedValue({});
    requestContext.getPlayCurrency.mockReturnValue(null);

    await expect(
      service.execute({ drawType: ArtifactDrawType.SINGLE as any, paymentType: ArtifactDrawPaymentType.CURRENCY as any })
    ).rejects.toThrow(CurrencyCodeRequiredException);
  });

  it('throws when artifact policy missing for currency payment', async () => {
    userStatusRepo.findByUserId.mockResolvedValue({});
    requestContext.getPlayCurrency.mockReturnValue('KRW');
    policyRepo.findPolicy.mockResolvedValue(null);

    await expect(
      service.execute({ drawType: ArtifactDrawType.SINGLE as any, paymentType: ArtifactDrawPaymentType.CURRENCY as any })
    ).rejects.toThrow(ArtifactPolicyNotFoundException);
  });

  it('throws when draw price not configured for currency', async () => {
    userStatusRepo.findByUserId.mockResolvedValue({});
    requestContext.getPlayCurrency.mockReturnValue('KRW');
    policyRepo.findPolicy.mockResolvedValue({ getDrawPrice: jest.fn().mockReturnValue(null) });

    await expect(
      service.execute({ drawType: ArtifactDrawType.SINGLE as any, paymentType: ArtifactDrawPaymentType.CURRENCY as any })
    ).rejects.toThrow(ArtifactDrawPriceNotFoundException);
  });

  it('creates a ticket draw request and spends tickets', async () => {
    const mockUserStatus = { spendTickets: jest.fn(), recordCurrencyDraw: jest.fn() };
    userStatusRepo.findByUserId.mockResolvedValue(mockUserStatus);

    const res = await service.execute({ drawType: ArtifactDrawType.SINGLE as any, paymentType: ArtifactDrawPaymentType.TICKET as any, ticketType: 'ALL' });

    expect(drawRequestRepo.save).toHaveBeenCalled();
    expect(mockUserStatus.spendTickets).toHaveBeenCalled();
    expect(userStatusRepo.update).toHaveBeenCalledWith(mockUserStatus);
    expect(wageringBetService.execute).not.toHaveBeenCalled();
    expect(res).toBeDefined();
  });

  it('creates a currency draw request and processes wagering', async () => {
    const mockUserStatus = { spendTickets: jest.fn(), recordCurrencyDraw: jest.fn() };
    userStatusRepo.findByUserId.mockResolvedValue(mockUserStatus);

    policyRepo.findPolicy.mockResolvedValue({ getDrawPrice: jest.fn().mockReturnValue(new Prisma.Decimal(10)) });
    requestContext.getPlayCurrency.mockReturnValue('KRW');
    exchangeRateService.getRate.mockResolvedValue(new Prisma.Decimal(1));

    const res = await service.execute({ drawType: ArtifactDrawType.SINGLE as any, paymentType: ArtifactDrawPaymentType.CURRENCY as any });

    expect(drawRequestRepo.save).toHaveBeenCalled();
    expect(exchangeRateService.getRate).toHaveBeenCalled();
    expect(wageringBetService.execute).toHaveBeenCalled();
    expect(mockUserStatus.recordCurrencyDraw).toHaveBeenCalled();
    expect(userStatusRepo.update).toHaveBeenCalledWith(mockUserStatus);
    expect(res).toBeDefined();
  });
});
