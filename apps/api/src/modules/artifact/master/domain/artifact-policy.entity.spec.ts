import { ArtifactPolicy } from './artifact-policy.entity';
import { ArtifactGrade, ExchangeCurrencyCode } from '@prisma/client';

describe('ArtifactPolicy', () => {
  it('getDrawPrice and TEN multiplier', () => {
    const now = new Date();
    const policy = ArtifactPolicy.rehydrate({
      id: 1n,
      drawPrices: { SINGLE: { [ExchangeCurrencyCode.USD]: 100 } },
      synthesisConfigs: { [ArtifactGrade.COMMON]: { requiredCount: 3, successRate: 0.5 } },
      slotUnlockConfigs: { unlockLevels: [1, 50, 100] },
      updatedAt: now,
    });
    const single = policy.getDrawPrice('SINGLE', ExchangeCurrencyCode.USD);
    expect(single).not.toBeNull();
    expect(single!.toNumber()).toBe(100);
    const ten = policy.getDrawPrice('TEN', ExchangeCurrencyCode.USD);
    expect(ten!.toNumber()).toBe(1000);
  });

  it('getSynthesisConfig and success logic', () => {
    const now = new Date();
    const synthesis = { requiredCount: 3, successRate: 0.5, guaranteedCount: undefined };
    const policy = ArtifactPolicy.rehydrate({
      id: 1n,
      drawPrices: { SINGLE: {} },
      synthesisConfigs: { [ArtifactGrade.COMMON]: synthesis },
      slotUnlockConfigs: { unlockLevels: [1, 50] },
      updatedAt: now,
    });
    const cfg = policy.getSynthesisConfig(ArtifactGrade.COMMON);
    expect(cfg).not.toBeNull();
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.4);
    expect(policy.isSynthesisSuccessful(ArtifactGrade.COMMON, 0)).toBe(true);
    spy.mockRestore();
  });

  it('guaranteedCount forces success', () => {
    const now = new Date();
    const policy = ArtifactPolicy.rehydrate({
      id: 1n,
      drawPrices: { SINGLE: {} },
      synthesisConfigs: { [ArtifactGrade.COMMON]: { requiredCount: 3, successRate: 0.0, guaranteedCount: 2 } },
      slotUnlockConfigs: { unlockLevels: [1] },
      updatedAt: now,
    });
    expect(policy.isSynthesisSuccessful(ArtifactGrade.COMMON, 2)).toBe(true);
  });

  it('getAvailableSlotCount and next grade and updates', () => {
    const now = new Date();
    const policy = ArtifactPolicy.rehydrate({
      id: 1n,
      drawPrices: { SINGLE: {} },
      synthesisConfigs: {},
      slotUnlockConfigs: { unlockLevels: [1, 50, 100] },
      updatedAt: now,
    });
    expect(policy.getAvailableSlotCount(60)).toBe(2);
    expect(policy.getNextGrade(ArtifactGrade.COMMON)).toBe(ArtifactGrade.UNCOMMON);
    expect(policy.getNextGrade(ArtifactGrade.UNIQUE)).toBeNull();

    // updateDrawPrices merge
    policy.updateDrawPrices({ SINGLE: { [ExchangeCurrencyCode.USD]: 200 } });
    const p = policy.getDrawPrice('SINGLE', ExchangeCurrencyCode.USD);
    expect(p!.toNumber()).toBe(200);

    // updateSynthesisConfigs merge
    policy.updateSynthesisConfigs({ [ArtifactGrade.RARE]: { requiredCount: 2, successRate: 0.2 } });
    expect(policy.getSynthesisConfig(ArtifactGrade.RARE)).not.toBeNull();
  });
});
