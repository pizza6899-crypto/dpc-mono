import { BannerTranslationService } from './banner-translation.service';
import { BannerInvalidImageFileIdException } from '../domain/banner.errors';
import { FileUsageType } from 'src/modules/file/domain/model/file-usage.type';
import { Language } from '@prisma/client';

describe('BannerTranslationService', () => {
  let service: BannerTranslationService;
  const mockRepo = {} as any;
  const mockAttach = { execute: jest.fn() } as any;
  const mockFileUrl = { getUrlsByFileIds: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BannerTranslationService(mockRepo, mockFileUrl, mockAttach);
  });

  it('attaches unique fileIds and resolves urls', async () => {
    const translations = [
      { language: Language.EN, isActive: true, imageFileId: '1', title: 'one' },
      { language: Language.EN, isActive: true, imageFileId: 2n, title: 'two' },
      { language: Language.KR, isActive: true, imageFileId: '1', title: 'dup' },
    ];

    const urls = new Map<string, string | null>([['1', 'http://a/1'], ['2', 'http://a/2']]);
    mockAttach.execute.mockResolvedValue(undefined);
    mockFileUrl.getUrlsByFileIds.mockResolvedValue(urls);

    const result = await service.replaceTranslations({ bannerId: 10n, translations });

    // attach called with unique bigint ids
    expect(mockAttach.execute).toHaveBeenCalledWith({ fileIds: [1n, 2n], usageType: FileUsageType.BANNER_IMAGE, usageId: 10n });
    expect(mockFileUrl.getUrlsByFileIds).toHaveBeenCalledWith([1n, 2n]);

    expect(result).toHaveLength(3);
    expect(result[0].imageUrl).toBe('http://a/1');
    expect(result[1].imageUrl).toBe('http://a/2');
    expect(result[2].imageUrl).toBe('http://a/1');
  });

  it('returns null imageUrl when no fileIds provided', async () => {
    const translations = [
      { language: Language.EN, isActive: true, title: 'no-file' },
    ];

    mockAttach.execute.mockResolvedValue(undefined);
    mockFileUrl.getUrlsByFileIds.mockResolvedValue(new Map());

    const result = await service.replaceTranslations({ bannerId: 5n, translations });

    expect(mockAttach.execute).not.toHaveBeenCalled();
    expect(mockFileUrl.getUrlsByFileIds).not.toHaveBeenCalled();
    expect(result[0].imageUrl).toBeNull();
  });

  it('throws BannerInvalidImageFileIdException for invalid file id', async () => {
    const translations = [
      { language: Language.EN, isActive: true, imageFileId: 'not-a-number' },
    ];

    await expect(service.replaceTranslations({ bannerId: 1n, translations })).rejects.toThrow(BannerInvalidImageFileIdException);
  });
});
