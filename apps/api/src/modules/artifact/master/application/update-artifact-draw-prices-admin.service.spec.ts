import { UpdateArtifactDrawPricesAdminService } from './update-artifact-draw-prices-admin.service';
import { ArtifactPolicy } from '../domain/artifact-policy.entity';

describe('UpdateArtifactDrawPricesAdminService', () => {
  let service: UpdateArtifactDrawPricesAdminService;
  let policyRepo: any;
  let policyPolicy: any;
  let advisoryLockService: any;

  beforeEach(() => {
    policyRepo = { findPolicy: jest.fn(), save: jest.fn() };
    policyPolicy = { validateDrawPrices: jest.fn() };
    advisoryLockService = { acquireLock: jest.fn().mockResolvedValue(undefined) };

    service = new UpdateArtifactDrawPricesAdminService(policyRepo, policyPolicy, advisoryLockService);
  });

  it('throws when policy missing', async () => {
    policyRepo.findPolicy.mockResolvedValue(null);
    await expect(service.execute({ drawPrices: { SINGLE: { USD: 100 } } } as any)).rejects.toThrow();
  });

  it('updates draw prices successfully', async () => {
    const policy = ArtifactPolicy.rehydrate({ id: 1n, drawPrices: { SINGLE: {} }, synthesisConfigs: {}, slotUnlockConfigs: { unlockLevels: [1] }, updatedAt: new Date() });
    policyRepo.findPolicy.mockResolvedValue(policy);
    policyRepo.save.mockResolvedValue(policy);

    const dto = { drawPrices: { SINGLE: { USD: 200 } } } as any;
    const result = await service.execute(dto);

    expect(policyRepo.findPolicy).toHaveBeenCalled();
    expect(policyPolicy.validateDrawPrices).toHaveBeenCalled();
    expect(policyRepo.save).toHaveBeenCalledWith(policy);
    expect(result).toBe(policy);
  });
});
