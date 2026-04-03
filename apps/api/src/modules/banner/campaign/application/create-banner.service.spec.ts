import { CreateBannerService } from './create-banner.service';

describe('CreateBannerService', () => {
  let service: CreateBannerService;
  const mockRepo = { create: jest.fn(), update: jest.fn() } as any;
  const mockTranslation = { replaceTranslations: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CreateBannerService(mockRepo, mockTranslation);
  });

  it('creates banner and persists translations when id returned', async () => {
    const params = { name: 'x', translations: [{ language: 'EN', imageFileId: '1' }] } as any;
    const created = { id: 1n, update: jest.fn() } as any;
    const persisted = { id: 1n, translations: [{ imageUrl: 'u' }] } as any;

    mockRepo.create.mockResolvedValue(created);
    mockTranslation.replaceTranslations.mockResolvedValue(persisted.translations);
    mockRepo.update.mockResolvedValue(persisted);

    const res = await service.execute(params);

    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockTranslation.replaceTranslations).toHaveBeenCalledWith({ bannerId: created.id, translations: params.translations });
    expect(mockRepo.update).toHaveBeenCalledWith(created);
    expect(res).toBe(persisted);
  });

  it('returns created when repository create returns no id', async () => {
    const params = { name: 'y' } as any;
    const created = { id: null } as any;
    mockRepo.create.mockResolvedValue(created);

    const res = await service.execute(params);
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockTranslation.replaceTranslations).not.toHaveBeenCalled();
    expect(mockRepo.update).not.toHaveBeenCalled();
    expect(res).toBe(created);
  });
});
