import { GetUserArtifactStatusService } from './get-user-artifact-status.service';
import { UserArtifactStatus } from '../domain/user-artifact-status.entity';

describe('GetUserArtifactStatusService', () => {
  it('returns existing status', async () => {
    const repo = { findByUserId: jest.fn().mockResolvedValue(UserArtifactStatus.create(1n)), upsert: jest.fn() };
    const svc = new GetUserArtifactStatusService(repo as any);
    const res = await svc.execute(1n);
    expect(res).toBeInstanceOf(UserArtifactStatus);
  });

  it('creates status when missing', async () => {
    const repo = { findByUserId: jest.fn().mockResolvedValue(null), upsert: jest.fn().mockResolvedValue(UserArtifactStatus.create(2n)) };
    const svc = new GetUserArtifactStatusService(repo as any);
    const res = await svc.execute(2n);
    expect(repo.upsert).toHaveBeenCalled();
    expect(res.userId).toBe(2n);
  });
});
