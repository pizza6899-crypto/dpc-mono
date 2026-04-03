import { GetMyArtifactProfileService } from './get-my-artifact-profile.service';
import { ArtifactCatalog } from '../../master/domain/artifact-catalog.entity';

describe('GetMyArtifactProfileService', () => {
  it('builds profile with slots and effects', async () => {
    const status = { activeSlotCount: 2, tickets: { all: 1 } };
    const statusService = { execute: jest.fn().mockResolvedValue(status) };

    const artifact = {
      id: 1n,
      catalog: { code: 'C1', grade: 'COMMON', statsSummary: { casinoBenefit: 1, slotBenefit: 0, sportsBenefit: 0, minigameBenefit: 0, badBeatBenefit: 0, criticalBenefit: 0 } },
      slotNo: 1,
      isEquipped: true,
      createdAt: new Date(),
    } as any;

    const repo = { findByUserId: jest.fn().mockResolvedValue([artifact]) };
    const sqids = { encode: jest.fn().mockReturnValue('enc') };

    const svc = new GetMyArtifactProfileService(statusService as any, repo as any, sqids as any);
    const res = await svc.execute(1n);

    expect(res.activeSlotCount).toBe(2);
    expect(res.slots[0].artifactCode).toBe('C1');
    expect(res.effects.casinoBenefit).toBe(1);
  });
});
