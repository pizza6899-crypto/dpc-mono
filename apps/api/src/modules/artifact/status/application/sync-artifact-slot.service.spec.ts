import { SyncArtifactSlotService } from './sync-artifact-slot.service';
import { UserArtifactStatus } from '../domain/user-artifact-status.entity';
import { ArtifactPolicy } from '../../master/domain/artifact-policy.entity';

describe('SyncArtifactSlotService', () => {
  it('updates slot count when expected greater', async () => {
    const status = UserArtifactStatus.create(1n);
    status.updateActiveSlotCount(1);
    const statusRepo = { findByUserId: jest.fn().mockResolvedValue(status), update: jest.fn().mockResolvedValue(status) };
    const policyService = { execute: jest.fn().mockResolvedValue(ArtifactPolicy.rehydrate({ id:1n, drawPrices: { SINGLE: {} }, synthesisConfigs: {}, slotUnlockConfigs: { unlockLevels: [1,50]}, updatedAt: new Date() })) };
    const findCharacterService = { execute: jest.fn().mockResolvedValue({ level: 60 }) };

    const svc = new SyncArtifactSlotService(statusRepo as any, policyService as any, findCharacterService as any);
    const res = await svc.execute(1n);
    expect(statusRepo.update).toHaveBeenCalled();
  });

  it('throws when status missing', async () => {
    const statusRepo = { findByUserId: jest.fn().mockResolvedValue(null), update: jest.fn() };
    const policyService = { execute: jest.fn() };
    const findCharacterService = { execute: jest.fn() };
    const svc = new SyncArtifactSlotService(statusRepo as any, policyService as any, findCharacterService as any);
    await expect(svc.execute(1n)).rejects.toThrow();
  });
});
