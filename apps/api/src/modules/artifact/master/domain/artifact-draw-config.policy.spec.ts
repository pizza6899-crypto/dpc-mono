import { ArtifactDrawConfig } from './artifact-draw-config.entity';
import { ArtifactDrawConfigPolicy } from './artifact-draw-config.policy';
import { ArtifactGrade, Prisma } from '@prisma/client';
import { ArtifactGradesIncompleteException, ArtifactProbabilitySumException } from './master.exception';

describe('ArtifactDrawConfigPolicy', () => {
  const policy = new ArtifactDrawConfigPolicy();

  it('validates correct configs', () => {
    const configs = [
      ArtifactDrawConfig.rehydrate({ grade: ArtifactGrade.COMMON, probability: new Prisma.Decimal(0.5), updatedAt: new Date() }),
      ArtifactDrawConfig.rehydrate({ grade: ArtifactGrade.UNCOMMON, probability: new Prisma.Decimal(0.3), updatedAt: new Date() }),
      ArtifactDrawConfig.rehydrate({ grade: ArtifactGrade.RARE, probability: new Prisma.Decimal(0.2), updatedAt: new Date() }),
    ];
    expect(() => policy.validateDrawConfigs(configs, 3)).not.toThrow();
  });

  it('throws when grades incomplete', () => {
    const configs = [
      ArtifactDrawConfig.rehydrate({ grade: ArtifactGrade.COMMON, probability: new Prisma.Decimal(0.5), updatedAt: new Date() }),
      ArtifactDrawConfig.rehydrate({ grade: ArtifactGrade.UNCOMMON, probability: new Prisma.Decimal(0.5), updatedAt: new Date() }),
    ];
    expect(() => policy.validateDrawConfigs(configs, 3)).toThrow(ArtifactGradesIncompleteException);
  });

  it('throws when sum not 1.0', () => {
    const configs = [
      ArtifactDrawConfig.rehydrate({ grade: ArtifactGrade.COMMON, probability: new Prisma.Decimal(0.4), updatedAt: new Date() }),
      ArtifactDrawConfig.rehydrate({ grade: ArtifactGrade.UNCOMMON, probability: new Prisma.Decimal(0.3), updatedAt: new Date() }),
      ArtifactDrawConfig.rehydrate({ grade: ArtifactGrade.RARE, probability: new Prisma.Decimal(0.2), updatedAt: new Date() }),
    ];
    // total 0.9
    expect(() => policy.validateDrawConfigs(configs, 3)).toThrow(ArtifactProbabilitySumException);
  });
});
