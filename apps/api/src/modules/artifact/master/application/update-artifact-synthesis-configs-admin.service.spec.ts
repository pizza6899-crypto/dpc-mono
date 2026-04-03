import { UpdateArtifactSynthesisConfigsAdminService } from './update-artifact-synthesis-configs-admin.service';
import { ArtifactPolicy } from '../domain/artifact-policy.entity';

describe('UpdateArtifactSynthesisConfigsAdminService', () => {
  let service: UpdateArtifactSynthesisConfigsAdminService;
  let policyRepo: any;
  let policyPolicy: any;
  let advisoryLockService: any;

  beforeEach(() => {
    policyRepo = { findPolicy: jest.fn(), save: jest.fn() };
    policyPolicy = { validateSynthesisConfigs: jest.fn() };
    advisoryLockService = { acquireLock: jest.fn().mockResolvedValue(undefined) };

    service = new UpdateArtifactSynthesisConfigsAdminService(policyRepo, policyPolicy, advisoryLockService);
  });

  it('throws when policy missing', async () => {
    policyRepo.findPolicy.mockResolvedValue(null);
    await expect(service.execute({ synthesisConfigs: {} } as any)).rejects.toThrow();
  });

  it('updates synthesis configs successfully', async () => {
    const policy = ArtifactPolicy.rehydrate({ id: 1n, drawPrices: { SINGLE: {} }, synthesisConfigs: {}, slotUnlockConfigs: { unlockLevels: [1] }, updatedAt: new Date() });
    policyRepo.findPolicy.mockResolvedValue(policy);
    policyRepo.save.mockResolvedValue(policy);

    const dto = { synthesisConfigs: { COMMON: { requiredCount: 2, successRate: 0.5 } } } as any;
    const result = await service.execute(dto);

    expect(policyRepo.findPolicy).toHaveBeenCalled();
    expect(policyPolicy.validateSynthesisConfigs).toHaveBeenCalled();
    expect(policyRepo.save).toHaveBeenCalledWith(policy);
    expect(result).toBe(policy);
  });
});
