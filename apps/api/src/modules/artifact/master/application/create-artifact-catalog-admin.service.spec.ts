import { CreateArtifactCatalogAdminService } from './create-artifact-catalog-admin.service';
import { ArtifactCatalog } from '../domain/artifact-catalog.entity';
import { ArtifactGrade } from '@prisma/client';
import { ArtifactCatalogAlreadyExistsException } from '../domain/master.exception';

describe('CreateArtifactCatalogAdminService', () => {
  let service: CreateArtifactCatalogAdminService;
  let mockRepo: any;
  let attachFileService: any;
  let fileUrlService: any;
  let advisoryLockService: any;

  beforeEach(() => {
    mockRepo = {
      findByCode: jest.fn(),
      save: jest.fn(),
    };
    attachFileService = { execute: jest.fn() };
    fileUrlService = { getUrl: jest.fn() };
    advisoryLockService = { acquireLock: jest.fn().mockResolvedValue(undefined) };

    service = new CreateArtifactCatalogAdminService(mockRepo, attachFileService, fileUrlService, advisoryLockService);
  });

  it('throws when code already exists', async () => {
    mockRepo.findByCode.mockResolvedValue({});

    await expect(service.execute({
      code: 'C1',
      grade: ArtifactGrade.COMMON,
      drawWeight: 10,
      casinoBenefit: 0,
      slotBenefit: 0,
      sportsBenefit: 0,
      minigameBenefit: 0,
      badBeatBenefit: 0,
      criticalBenefit: 0,
    })).rejects.toThrow(ArtifactCatalogAlreadyExistsException);
  });

  it('creates artifact without file', async () => {
    mockRepo.findByCode.mockResolvedValue(null);
    mockRepo.save.mockImplementation(async (artifact: ArtifactCatalog) => {
      return ArtifactCatalog.rehydrate({
        id: 1n,
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
        imageUrl: artifact.imageUrl,
        createdAt: artifact.createdAt,
        updatedAt: new Date(),
      });
    });

    const result = await service.execute({
      code: 'C2',
      grade: ArtifactGrade.COMMON,
      drawWeight: 5,
      casinoBenefit: 1,
      slotBenefit: 1,
      sportsBenefit: 1,
      minigameBenefit: 1,
      badBeatBenefit: 1,
      criticalBenefit: 1,
    });

    expect(result.id).toBe(1n);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('creates artifact with file and updates image', async () => {
    mockRepo.findByCode.mockResolvedValue(null);

    // first save returns entity with id
    mockRepo.save.mockImplementationOnce(async (artifact: ArtifactCatalog) => ArtifactCatalog.rehydrate({
      id: 2n,
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
      imageUrl: null,
      createdAt: artifact.createdAt,
      updatedAt: new Date(),
    }));

    // second save returns updated image url
    mockRepo.save.mockImplementationOnce(async (artifact: ArtifactCatalog) => ArtifactCatalog.rehydrate({
      id: 2n,
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
      imageUrl: 'https://cdn.test/url.png',
      createdAt: artifact.createdAt,
      updatedAt: new Date(),
    }));

    attachFileService.execute.mockResolvedValue({ files: [{ id: 'f1' }] });
    fileUrlService.getUrl.mockResolvedValue('https://cdn.test/url.png');

    const result = await service.execute({
      code: 'C3',
      grade: ArtifactGrade.COMMON,
      drawWeight: 1,
      casinoBenefit: 1,
      slotBenefit: 1,
      sportsBenefit: 1,
      minigameBenefit: 1,
      badBeatBenefit: 1,
      criticalBenefit: 1,
      fileId: 'f1',
    });

    expect(result.id).toBe(2n);
    expect(attachFileService.execute).toHaveBeenCalled();
    expect(fileUrlService.getUrl).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalledTimes(2);
    expect(result.imageUrl).toBe('https://cdn.test/url.png');
  });
});
