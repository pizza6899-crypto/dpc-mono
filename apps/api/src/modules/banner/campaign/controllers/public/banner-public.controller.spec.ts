import { Test } from '@nestjs/testing';
import { BannerPublicController } from './banner-public.controller';
import { FindBannersService } from '../../application/find-banners.service';
import { Language } from '@prisma/client';

describe('BannerPublicController', () => {
  let controller: BannerPublicController;
  const mockFind = { execute: jest.fn() } as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [BannerPublicController],
      providers: [{ provide: FindBannersService, useValue: mockFind }],
    }).compile();

    controller = module.get(BannerPublicController);
    jest.clearAllMocks();
  });

  it('returns mapped banners for requested language', async () => {
    const banner = {
      order: 1,
      linkUrl: 'https://a',
      translations: [
        { language: Language.KO, isActive: true, imageUrl: 'img-ko', title: '제목', altText: 'alt' },
      ],
    } as any;

    mockFind.execute.mockResolvedValue([banner]);

    const res = await controller.list({ language: Language.KO } as any);

    expect(mockFind.execute).toHaveBeenCalledWith({ isActive: true, language: Language.KO });
    expect(res).toHaveLength(1);
    expect(res[0].imageUrl).toBe('img-ko');
    expect(res[0].title).toBe('제목');
  });

  it('falls back to EN when requested language not available', async () => {
    const banner = {
      order: 2,
      translations: [
        { language: Language.EN, isActive: true, imageUrl: 'img-en', title: 'Title' },
      ],
    } as any;

    mockFind.execute.mockResolvedValue([banner]);

    const res = await controller.list({ language: Language.KO } as any);

    expect(res).toHaveLength(1);
    expect(res[0].imageUrl).toBe('img-en');
  });

  it('filters out banners without imageUrl', async () => {
    const withImage = { order: 3, translations: [{ language: Language.EN, isActive: true, imageUrl: 'ok' }] } as any;
    const withoutImage = { order: 4, translations: [{ language: Language.EN, isActive: true, imageUrl: null }] } as any;

    mockFind.execute.mockResolvedValue([withImage, withoutImage]);

    const res = await controller.list({} as any);

    expect(res).toHaveLength(1);
    expect(res[0].imageUrl).toBe('ok');
  });

  it('handles paginated result shape', async () => {
    const banner = { order: 5, translations: [{ language: Language.EN, isActive: true, imageUrl: 'img' }] } as any;
    mockFind.execute.mockResolvedValue({ data: [banner], page: 1, limit: 10, total: 1 });

    const res = await controller.list({} as any);

    expect(res).toHaveLength(1);
    expect(res[0].imageUrl).toBe('img');
  });
});
