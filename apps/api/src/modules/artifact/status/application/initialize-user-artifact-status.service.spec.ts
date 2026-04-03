import { InitializeUserArtifactStatusService } from './initialize-user-artifact-status.service';
import { UserArtifactStatus } from '../domain/user-artifact-status.entity';

describe('InitializeUserArtifactStatusService', () => {
  it('creates and syncs status when missing', async () => {
    const statusRepo = { findByUserId: jest.fn().mockResolvedValue(null), upsert: jest.fn().mockResolvedValue(UserArtifactStatus.create(1n)), update: jest.fn() };
    const syncSlotService = { execute: jest.fn().mockResolvedValue(UserArtifactStatus.create(1n)) };
    const svc = new InitializeUserArtifactStatusService(statusRepo as any, syncSlotService as any);
    const res = await svc.execute(1n);
    expect(syncSlotService.execute).toHaveBeenCalled();
  });

  it('syncs even when exists', async () => {
    const statusRepo = { findByUserId: jest.fn().mockResolvedValue(UserArtifactStatus.create(2n)), upsert: jest.fn(), update: jest.fn() };
    const syncSlotService = { execute: jest.fn().mockResolvedValue(UserArtifactStatus.create(2n)) };
    const svc = new InitializeUserArtifactStatusService(statusRepo as any, syncSlotService as any);
    const res = await svc.execute(2n);
    expect(syncSlotService.execute).toHaveBeenCalled();
  });
});
