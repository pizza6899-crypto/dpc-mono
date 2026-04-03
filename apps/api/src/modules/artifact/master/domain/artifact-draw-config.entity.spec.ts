import { ArtifactDrawConfig } from './artifact-draw-config.entity';
import { ArtifactGrade, Prisma } from '@prisma/client';
import { ArtifactProbabilityOutOfRangeException } from './master.exception';

describe('ArtifactDrawConfig', () => {
  it('updates probability within range', () => {
    const cfg = ArtifactDrawConfig.rehydrate({ grade: ArtifactGrade.COMMON, probability: new Prisma.Decimal(0.2), updatedAt: new Date() });
    const before = cfg.updatedAt;
    cfg.updateProbability(0.5);
    expect(cfg.probability.toNumber()).toBeCloseTo(0.5);
    expect(cfg.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('throws when probability out of range', () => {
    const cfg = ArtifactDrawConfig.rehydrate({ grade: ArtifactGrade.COMMON, probability: new Prisma.Decimal(0.2), updatedAt: new Date() });
    expect(() => cfg.updateProbability(-0.1)).toThrow(ArtifactProbabilityOutOfRangeException);
    expect(() => cfg.updateProbability(1.1)).toThrow(ArtifactProbabilityOutOfRangeException);
  });
});
