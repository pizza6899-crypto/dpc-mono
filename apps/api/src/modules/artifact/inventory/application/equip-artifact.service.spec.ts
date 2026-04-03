import { EquipArtifactService } from './equip-artifact.service';
import { UserArtifact } from '../domain/user-artifact.entity';
import { ArtifactCatalog } from '../../master/domain/artifact-catalog.entity';
import { ArtifactAlreadyEquippedException, InvalidArtifactSlotException, UserArtifactNotFoundException } from '../domain/inventory.exception';

describe('EquipArtifactService', () => {
  let service: EquipArtifactService;
  let requestContext: any;
  let lockService: any;
  let repository: any;
  let statusService: any;
  let getEquippedStatsService: any;
  let syncTotalStatsService: any;
  let universalLogService: any;

  beforeEach(() => {
    requestContext = { getUserId: jest.fn().mockReturnValue(123n) };
    lockService = { acquireLock: jest.fn().mockResolvedValue(undefined) };

    repository = {
      findById: jest.fn(),
      findBySlot: jest.fn(),
      update: jest.fn(),
    };

    statusService = { execute: jest.fn() };
    getEquippedStatsService = { execute: jest.fn() };
    syncTotalStatsService = { execute: jest.fn() };
    universalLogService = { execute: jest.fn() };

    service = new EquipArtifactService(
      requestContext,
      lockService,
      repository,
      statusService,
      getEquippedStatsService,
      syncTotalStatsService,
      universalLogService,
    );
  });

  it('throws when artifact not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.execute(1n, 1)).rejects.toThrow(UserArtifactNotFoundException);
  });

  it('throws when invalid slot', async () => {
    const ua = UserArtifact.create(123n, 10n);
    repository.findById.mockResolvedValue(ua);
    statusService.execute.mockResolvedValue({ activeSlotCount: 0 });
    await expect(service.execute(1n, 1)).rejects.toThrow(InvalidArtifactSlotException);
  });

  it('throws when already equipped to same slot', async () => {
    const ua = UserArtifact.create(123n, 10n);
    ua.equip(1);
    repository.findById.mockResolvedValue(ua);
    statusService.execute.mockResolvedValue({ activeSlotCount: 2 });
    await expect(service.execute(1n, 1)).rejects.toThrow(ArtifactAlreadyEquippedException);
  });

  it('equips artifact into empty slot and records logs', async () => {
    const ua = UserArtifact.create(123n, 10n);
    const catalog = ArtifactCatalog.create({ code: 'C1', grade: 'COMMON' as any, drawWeight: 1, stats: { casinoBenefit:1, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } });
    ua.setCatalog(catalog);

    repository.findById.mockResolvedValue(ua);
    repository.findBySlot.mockResolvedValue(null);
    repository.update.mockImplementation(async (u: UserArtifact) => u);
    statusService.execute.mockResolvedValue({ activeSlotCount: 2 });
    getEquippedStatsService.execute.mockResolvedValue({});
    syncTotalStatsService.execute.mockResolvedValue(undefined);
    universalLogService.execute.mockResolvedValue(undefined);

    const res = await service.execute(1n, 1);

    expect(repository.update).toHaveBeenCalled();
    expect(syncTotalStatsService.execute).toHaveBeenCalled();
    expect(universalLogService.execute).toHaveBeenCalled();
    expect(res.artifactCode).toBe('C1');
    expect(res.slotNo).toBe(1);
  });

  it('swaps artifacts when slot occupied', async () => {
    // Use distinct IDs so the swap path triggers (create() uses id=0n)
    const catalog = ArtifactCatalog.create({ code: 'C2', grade: 'COMMON' as any, drawWeight: 1, stats: { casinoBenefit:1, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } });
    const ua = UserArtifact.rehydrate({
      id: 1n,
      userId: 123n,
      artifactId: 10n,
      slotNo: null,
      isEquipped: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      catalog,
    });

    const existingCatalog = ArtifactCatalog.create({ code: 'OLD', grade: 'COMMON' as any, drawWeight: 1, stats: { casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } });
    const existing = UserArtifact.rehydrate({
      id: 2n,
      userId: 123n,
      artifactId: 11n,
      slotNo: 2,
      isEquipped: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      catalog: existingCatalog,
    });

    repository.findById.mockResolvedValue(ua);
    repository.findBySlot.mockResolvedValue(existing);
    repository.update.mockImplementation(async (u: UserArtifact) => u);
    statusService.execute.mockResolvedValue({ activeSlotCount: 3 });
    getEquippedStatsService.execute.mockResolvedValue({});
    syncTotalStatsService.execute.mockResolvedValue(undefined);
    universalLogService.execute.mockResolvedValue(undefined);

    const res = await service.execute(1n, 2);

    expect(repository.update).toHaveBeenCalledTimes(2);
    expect(universalLogService.execute).toHaveBeenCalled();
    const logArg = universalLogService.execute.mock.calls[0][0];
    expect(logArg.payload.prevArtifactCode).toBe('OLD');
  });
});
