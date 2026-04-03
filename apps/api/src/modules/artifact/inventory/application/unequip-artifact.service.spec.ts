import { UnequipArtifactService } from './unequip-artifact.service';
import { UserArtifact } from '../domain/user-artifact.entity';
import { UserArtifactNotFoundException } from '../domain/inventory.exception';

describe('UnequipArtifactService', () => {
  let service: UnequipArtifactService;
  let requestContext: any;
  let lockService: any;
  let repository: any;
  let getEquippedStatsService: any;
  let syncTotalStatsService: any;
  let universalLogService: any;

  beforeEach(() => {
    requestContext = { getUserId: jest.fn().mockReturnValue(123n) };
    lockService = { acquireLock: jest.fn().mockResolvedValue(undefined) };

    repository = { findById: jest.fn(), update: jest.fn() };
    getEquippedStatsService = { execute: jest.fn() };
    syncTotalStatsService = { execute: jest.fn() };
    universalLogService = { execute: jest.fn() };

    service = new UnequipArtifactService(requestContext, lockService, repository, getEquippedStatsService, syncTotalStatsService, universalLogService);
  });

  it('throws when not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.execute(1n)).rejects.toThrow(UserArtifactNotFoundException);
  });

  it('is idempotent when already unequipped', async () => {
    const ua = UserArtifact.create(123n, 10n);
    repository.findById.mockResolvedValue(ua);
    const res = await service.execute(1n);
    expect(res).toBe(true);
  });

  it('unequips and syncs stats', async () => {
    const ua = UserArtifact.create(123n, 10n);
    ua.equip(1);
    repository.findById.mockResolvedValue(ua);
    repository.update.mockResolvedValue(ua);
    getEquippedStatsService.execute.mockResolvedValue({});
    syncTotalStatsService.execute.mockResolvedValue(undefined);
    universalLogService.execute.mockResolvedValue(undefined);

    const res = await service.execute(1n);
    expect(repository.update).toHaveBeenCalled();
    expect(syncTotalStatsService.execute).toHaveBeenCalled();
    expect(universalLogService.execute).toHaveBeenCalled();
    expect(res).toBe(true);
  });
});
