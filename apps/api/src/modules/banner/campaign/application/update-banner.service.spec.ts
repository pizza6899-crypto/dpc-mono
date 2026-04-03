import { UpdateBannerService } from './update-banner.service';

describe('UpdateBannerService', () => {
  let service: UpdateBannerService;
  const mockRepo = { getById: jest.fn(), update: jest.fn() } as any;
  const mockTranslation = { replaceTranslations: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UpdateBannerService(mockRepo, mockTranslation);
  });

  it('resolves translations and updates banner', async () => {
    const existing = { id: 2n, translations: [], update: jest.fn() } as any;
    mockRepo.getById.mockResolvedValue(existing);
    mockTranslation.replaceTranslations.mockResolvedValue([{ imageUrl: 'u' }]);
    mockRepo.update.mockResolvedValue({ ...existing, translations: [{ imageUrl: 'u' }] });

    const res = await service.execute({ id: 2n, translations: [{ imageFileId: '1' }] } as any);

    expect(mockRepo.getById).toHaveBeenCalledWith(2n);
    expect(mockTranslation.replaceTranslations).toHaveBeenCalledWith({ bannerId: 2n, translations: [{ imageFileId: '1' }] });
    expect(mockRepo.update).toHaveBeenCalled();
    expect(res.translations[0].imageUrl).toBe('u');
  });
});
