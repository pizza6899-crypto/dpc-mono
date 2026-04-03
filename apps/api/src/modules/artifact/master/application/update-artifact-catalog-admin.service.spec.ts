import { UpdateArtifactCatalogAdminService } from './update-artifact-catalog-admin.service';
import { ArtifactCatalog } from '../domain/artifact-catalog.entity';
import { ArtifactGrade } from '@prisma/client';
import { ArtifactCatalogAlreadyExistsException, ArtifactCatalogNotFoundException } from '../domain/master.exception';

describe('UpdateArtifactCatalogAdminService', () => {
  let service: UpdateArtifactCatalogAdminService;
  let mockRepo: any;
  let attachFileService: any;
  let fileUrlService: any;
  let advisoryLockService: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      save: jest.fn(),
    };
    attachFileService = { execute: jest.fn() };
    fileUrlService = { getUrl: jest.fn() };
    advisoryLockService = { acquireLock: jest.fn().mockResolvedValue(undefined) };

    service = new UpdateArtifactCatalogAdminService(mockRepo, attachFileService, fileUrlService, advisoryLockService);
  });

  it('throws when artifact not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.execute({ id: 999n })).rejects.toThrow(ArtifactCatalogNotFoundException);
  });

  it('throws when new code already exists', async () => {
    const existing = ArtifactCatalog.create({ code: 'X', grade: ArtifactGrade.COMMON, drawWeight: 1, stats: { casinoBenefit:1, slotBenefit:1, sportsBenefit:1, minigameBenefit:1, badBeatBenefit:1, criticalBenefit:1 } });
    const target = ArtifactCatalog.rehydrate({ id: 10n, code: 'OLD', grade: ArtifactGrade.COMMON, drawWeight: 1, status: (existing as any).status, casinoBenefit:1, slotBenefit:1, sportsBenefit:1, minigameBenefit:1, badBeatBenefit:1, criticalBenefit:1, imageUrl: null, createdAt: new Date(), updatedAt: new Date() });
    mockRepo.findById.mockResolvedValue(target);
    mockRepo.findByCode.mockResolvedValue(existing);

    await expect(service.execute({ id: 10n, code: 'X' })).rejects.toThrow(ArtifactCatalogAlreadyExistsException);
  });

  it('updates fields without file', async () => {
    const target = ArtifactCatalog.rehydrate({ id: 20n, code: 'OLD2', grade: ArtifactGrade.COMMON, drawWeight: 2, status: (ArtifactCatalog.create({ code: 'a', grade: ArtifactGrade.COMMON, drawWeight: 1, stats: { casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } }) as any).status, casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0, imageUrl: null, createdAt: new Date(), updatedAt: new Date() });
    mockRepo.findById.mockResolvedValue(target);
    mockRepo.findByCode.mockResolvedValue(null);
    mockRepo.save.mockImplementation(async (artifact: ArtifactCatalog) => artifact);

    const result = await service.execute({ id: 20n, drawWeight: 5, casinoBenefit: 3 });
    expect(result.drawWeight).toBe(5);
    expect(result.statsSummary.casinoBenefit).toBe(3);
  });

  it('updates image when file provided', async () => {
    const target = ArtifactCatalog.rehydrate({ id: 30n, code: 'IMG', grade: ArtifactGrade.COMMON, drawWeight: 2, status: (ArtifactCatalog.create({ code: 'a', grade: ArtifactGrade.COMMON, drawWeight: 1, stats: { casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0 } }) as any).status, casinoBenefit:0, slotBenefit:0, sportsBenefit:0, minigameBenefit:0, badBeatBenefit:0, criticalBenefit:0, imageUrl: null, createdAt: new Date(), updatedAt: new Date() });
    mockRepo.findById.mockResolvedValue(target);
    mockRepo.findByCode.mockResolvedValue(null);
    mockRepo.save.mockImplementation(async (artifact: ArtifactCatalog) => ArtifactCatalog.rehydrate({
      id: 30n,
      code: artifact.code,
      grade: artifact.grade,
      drawWeight: artifact.drawWeight,
      status: artifact.status,
      casinoBenefit: artifact.statsSummary.casinoBenefit,
      slotBenefit: artifact.statsSummary.slotBenefit,
      sportsBenefit: artifact.statsSummary.sportsBenefit,
      minigameBenefit: artifact.statsSummary.minigameBenefit,
      badBeatBenefit: artifact.statsSummary.badBeatBenefit,
      criticalBenefit: artifact.statsSummary.criticalBenefit,
      imageUrl: 'https://cdn.test/updated.png',
      createdAt: artifact.createdAt,
      updatedAt: new Date(),
    }));

    attachFileService.execute.mockResolvedValue({ files: [{ id: 'f2' }] });
    fileUrlService.getUrl.mockResolvedValue('https://cdn.test/updated.png');

    const result = await service.execute({ id: 30n, fileId: 'f2' });
    expect(result.imageUrl).toBe('https://cdn.test/updated.png');
  });
});
