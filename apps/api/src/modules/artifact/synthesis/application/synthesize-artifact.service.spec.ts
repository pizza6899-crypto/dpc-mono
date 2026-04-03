import { SynthesizeArtifactService } from './synthesize-artifact.service';
import { UserArtifact } from '../../inventory/domain/user-artifact.entity';
import { ArtifactGrade } from '@prisma/client';
import { ArtifactStatusNotFoundException } from '../../status/domain/status.exception';
import { InvalidSynthesisIngredientsException, SynthesisPolicyNotConfiguredException, MaxGradeSynthesisException, BlockchainSyncException } from '../domain/synthesis.exception';

describe('SynthesizeArtifactService', () => {
  let service: SynthesizeArtifactService;
  let requestContext: any;
  let lockService: any;
  let solanaService: any;
  let synthesisPolicy: any;
  let userArtifactRepo: any;
  let userArtifactStatusRepo: any;
  let policyRepo: any;
  let catalogRepo: any;
  let universalLogService: any;

  beforeEach(() => {
    requestContext = { getUserId: jest.fn().mockReturnValue(100n) };
    lockService = { acquireLock: jest.fn().mockResolvedValue(undefined) };
    solanaService = { getCurrentSlot: jest.fn().mockResolvedValue(12345), getBlockHashBySlot: jest.fn().mockResolvedValue('bh') };

    synthesisPolicy = {
      rollSynthesis: jest.fn().mockReturnValue({ isSuccess: true, isGuaranteed: false, targetGrade: 'UNCOMMON', remappedRoll: 0.4 }),
      selectArtifactFromPool: jest.fn().mockReturnValue({ id: 500n, code: 'R1', grade: 'UNCOMMON' }),
    };

    userArtifactRepo = {
      findById: jest.fn(),
      deleteAll: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue({ id: 600n, createdAt: new Date() }),
    };

    userArtifactStatusRepo = {
      findByUserId: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    policyRepo = { findPolicy: jest.fn() };
    catalogRepo = { findAll: jest.fn().mockResolvedValue([]) };
    universalLogService = { execute: jest.fn().mockResolvedValue(undefined) };

    service = new SynthesizeArtifactService(
      requestContext,
      lockService,
      solanaService,
      synthesisPolicy,
      userArtifactRepo,
      userArtifactStatusRepo,
      policyRepo,
      catalogRepo,
      universalLogService,
    );
  });

  it('throws for duplicate ingredient ids', async () => {
    await expect(service.execute([1n, 1n])).rejects.toThrow(InvalidSynthesisIngredientsException);
  });

  it('throws when ingredient not found or not owned', async () => {
    userArtifactRepo.findById.mockResolvedValue(null);
    await expect(service.execute([1n, 2n])).rejects.toThrow(InvalidSynthesisIngredientsException);
  });

  it('throws when ingredient is equipped', async () => {
    const ua = UserArtifact.create(100n, 10n);
    ua.setCatalog({ code: 'C', grade: 'COMMON' as any, drawWeight: 1, stats: { casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } });
    ua.equip(1);
    userArtifactRepo.findById.mockResolvedValue(ua);

    await expect(service.execute([1n, 2n])).rejects.toThrow(InvalidSynthesisIngredientsException);
  });

  it('throws when mixed grades are provided', async () => {
    const a = UserArtifact.rehydrate({ id: 1n, userId: 100n, artifactId: 10n, slotNo: null, isEquipped: false, createdAt: new Date(), updatedAt: new Date(), catalog: { code: 'A', grade: 'COMMON' as any, drawWeight: 1, stats: { casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } } });
    const b = UserArtifact.rehydrate({ id: 2n, userId: 100n, artifactId: 11n, slotNo: null, isEquipped: false, createdAt: new Date(), updatedAt: new Date(), catalog: { code: 'B', grade: 'UNCOMMON' as any, drawWeight: 1, stats: { casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } } });
    userArtifactRepo.findById.mockImplementation(async (id: bigint) => id === 1n ? a : b);

    await expect(service.execute([1n, 2n])).rejects.toThrow(InvalidSynthesisIngredientsException);
  });

  it('throws when trying to synthesize max grade', async () => {
    const a = UserArtifact.rehydrate({ id: 1n, userId: 100n, artifactId: 10n, slotNo: null, isEquipped: false, createdAt: new Date(), updatedAt: new Date(), catalog: { code: 'Z', grade: 'UNIQUE' as any, drawWeight: 1, stats: { casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } } });
    userArtifactRepo.findById.mockResolvedValue(a);

    await expect(service.execute([1n, 2n])).rejects.toThrow(MaxGradeSynthesisException);
  });

  it('throws when policy or config missing', async () => {
    const a = UserArtifact.rehydrate({ id: 1n, userId: 100n, artifactId: 10n, slotNo: null, isEquipped: false, createdAt: new Date(), updatedAt: new Date(), catalog: { code: 'C', grade: 'COMMON' as any, drawWeight: 1, stats: { casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } } });
    userArtifactRepo.findById.mockResolvedValue(a);
    policyRepo.findPolicy.mockResolvedValue(null);

    await expect(service.execute([1n, 2n])).rejects.toThrow(SynthesisPolicyNotConfiguredException);
  });

  it('throws when user status missing', async () => {
    const a = UserArtifact.rehydrate({ id: 1n, userId: 100n, artifactId: 10n, slotNo: null, isEquipped: false, createdAt: new Date(), updatedAt: new Date(), catalog: { code: 'C', grade: 'COMMON' as any, drawWeight: 1, stats: { casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } } });
    userArtifactRepo.findById.mockResolvedValue(a);
    policyRepo.findPolicy.mockResolvedValue({ synthesisConfigs: { COMMON: { requiredCount: 1, successRate: 0.5, guaranteedCount: 0 } } });
    userArtifactStatusRepo.findByUserId.mockResolvedValue(null);

    await expect(service.execute([1n])).rejects.toThrow(ArtifactStatusNotFoundException);
  });

  it('throws when blockhash missing', async () => {
    const a = UserArtifact.rehydrate({ id: 1n, userId: 100n, artifactId: 10n, slotNo: null, isEquipped: false, createdAt: new Date(), updatedAt: new Date(), catalog: { code: 'C', grade: 'COMMON' as any, drawWeight: 1, stats: { casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } } });
    userArtifactRepo.findById.mockResolvedValue(a);
    policyRepo.findPolicy.mockResolvedValue({ synthesisConfigs: { COMMON: { requiredCount: 1, successRate: 0.5, guaranteedCount: 0 } } });
    userArtifactStatusRepo.findByUserId.mockResolvedValue({ getSynthesisPityCount: jest.fn().mockReturnValue(0) });
    solanaService.getBlockHashBySlot.mockResolvedValue(null);

    await expect(service.execute([1n])).rejects.toThrow(BlockchainSyncException);
  });

  it('successful synthesis path', async () => {
    const a = UserArtifact.rehydrate({ id: 1n, userId: 100n, artifactId: 10n, slotNo: null, isEquipped: false, createdAt: new Date(), updatedAt: new Date(), catalog: { code: 'C', grade: 'COMMON' as any, drawWeight: 1, stats: { casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } } });
    userArtifactRepo.findById.mockResolvedValue(a);
    policyRepo.findPolicy.mockResolvedValue({ synthesisConfigs: { COMMON: { requiredCount: 1, successRate: 0.8, guaranteedCount: 0 } } });
    userArtifactStatusRepo.findByUserId.mockResolvedValue({ getSynthesisPityCount: jest.fn().mockReturnValue(0), recordSynthesisSuccess: jest.fn(), recordSynthesisFail: jest.fn(), resetSynthesisPityCount: jest.fn(), getSynthesisPityCount: jest.fn().mockReturnValue(0) });

    const res = await service.execute([1n]);

    expect(userArtifactRepo.deleteAll).toHaveBeenCalledWith([1n]);
    expect(userArtifactRepo.save).toHaveBeenCalled();
    expect(userArtifactStatusRepo.update).toHaveBeenCalled();
    expect(universalLogService.execute).toHaveBeenCalled();
    expect(res.reward.artifactCode).toBe('R1');
  });
});
