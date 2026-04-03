import { ArtifactPolicyPolicy } from './artifact-policy.policy';
import { ArtifactGrade } from '@prisma/client';
import { ArtifactPolicyIncompleteException, InvalidArtifactDrawPriceValueException, InvalidArtifactSynthesisRequiredCountException, InvalidArtifactSynthesisSuccessRateException, InvalidArtifactSynthesisGuaranteedCountException } from './master.exception';

describe('ArtifactPolicyPolicy', () => {
  const policy = new ArtifactPolicyPolicy();

  it('throws when SINGLE missing or empty', () => {
    expect(() => policy.validateDrawPrices({} as any)).toThrow(ArtifactPolicyIncompleteException);
    expect(() => policy.validateDrawPrices({ SINGLE: {} } as any)).toThrow(ArtifactPolicyIncompleteException);
  });

  it('throws for negative amounts', () => {
    expect(() => policy.validateDrawPrices({ SINGLE: { USD: -1 } } as any)).toThrow(InvalidArtifactDrawPriceValueException);
  });

  it('validateSynthesisConfigs checks fields', () => {
    const badRequired = { [ArtifactGrade.COMMON]: { requiredCount: 0, successRate: 0.5 } };
    expect(() => policy.validateSynthesisConfigs(badRequired as any)).toThrow(InvalidArtifactSynthesisRequiredCountException);

    const badRate = { [ArtifactGrade.COMMON]: { requiredCount: 1, successRate: -0.1 } };
    expect(() => policy.validateSynthesisConfigs(badRate as any)).toThrow(InvalidArtifactSynthesisSuccessRateException);

    const badPity = { [ArtifactGrade.COMMON]: { requiredCount: 1, successRate: 0.5, guaranteedCount: 0 } };
    expect(() => policy.validateSynthesisConfigs(badPity as any)).toThrow(InvalidArtifactSynthesisGuaranteedCountException);
  });
});
