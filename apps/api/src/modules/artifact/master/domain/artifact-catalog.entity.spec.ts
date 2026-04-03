import { ArtifactCatalog } from './artifact-catalog.entity';
import { ArtifactGrade, ArtifactCatalogStatus } from '@prisma/client';

describe('ArtifactCatalog', () => {
  const stats = {
    casinoBenefit: 1,
    slotBenefit: 2,
    sportsBenefit: 3,
    minigameBenefit: 4,
    badBeatBenefit: 5,
    criticalBenefit: 6,
  };

  it('creates with defaults', () => {
    const a = ArtifactCatalog.create({ code: 'C1', grade: ArtifactGrade.COMMON, drawWeight: 10, stats });
    expect(a.id).toBe(0n);
    expect(a.code).toBe('C1');
    expect(a.grade).toBe(ArtifactGrade.COMMON);
    expect(a.drawWeight).toBe(10);
    expect(a.statsSummary).toEqual(stats);
    expect(a.status).toBe(ArtifactCatalogStatus.ACTIVE);
    expect(a.imageUrl).toBeNull();
    expect(a.createdAt).toBeInstanceOf(Date);
    expect(a.updatedAt).toBeInstanceOf(Date);
  });

  it('updates image url and updatedAt', () => {
    const a = ArtifactCatalog.create({ code: 'C1', grade: ArtifactGrade.COMMON, drawWeight: 10, stats });
    const before = a.updatedAt;
    a.updateImageUrl('https://img.example/test.png');
    expect(a.imageUrl).toBe('https://img.example/test.png');
    expect(a.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('updates fields and updatedAt', () => {
    const a = ArtifactCatalog.create({ code: 'C1', grade: ArtifactGrade.COMMON, drawWeight: 10, stats });
    const before = a.updatedAt;
    const newStats = { ...stats, casinoBenefit: 99 };
    a.update({
      code: 'NEW',
      grade: ArtifactGrade.RARE,
      drawWeight: 5,
      stats: newStats,
      status: ArtifactCatalogStatus.INACTIVE,
    });
    expect(a.code).toBe('NEW');
    expect(a.grade).toBe(ArtifactGrade.RARE);
    expect(a.drawWeight).toBe(5);
    expect(a.statsSummary).toEqual(newStats);
    expect(a.status).toBe(ArtifactCatalogStatus.INACTIVE);
    expect(a.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('deactivates', () => {
    const a = ArtifactCatalog.create({ code: 'C1', grade: ArtifactGrade.COMMON, drawWeight: 10, stats });
    a.deactivate();
    expect(a.status).toBe(ArtifactCatalogStatus.INACTIVE);
  });
});
