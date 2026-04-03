import { BannerMapper } from './banner.mapper';
import { Banner } from '../domain/banner.entity';
import { Language } from '@prisma/client';

describe('BannerMapper', () => {
  const mapper = new BannerMapper();

  it('toDomain maps prisma shape to domain', () => {
    const prisma = {
      id: 3n,
      name: 'nm',
      isActive: false,
      order: 7,
      linkUrl: 'u',
      startDate: null,
      endDate: null,
      deletedAt: null,
      translations: [
        { id: 1n, language: Language.EN, isActive: true, imageUrl: 'i', title: 't', altText: 'a', linkUrl: 'l' },
      ],
      createdAt: null,
      updatedAt: null,
    } as any;

    const domain = mapper.toDomain(prisma);
    expect(domain.id).toBe(3n);
    expect(domain.name).toBe('nm');
    expect(domain.isActive).toBe(false);
    expect(domain.translations.length).toBe(1);
    expect(domain.translations[0].imageUrl).toBe('i');
  });

  it('toPrisma and toPrismaTranslations produce expected shapes', () => {
    const b = Banner.create({
      name: 'x',
      isActive: true,
      order: 2,
      linkUrl: 'u',
      translations: [{ language: Language.KO, isActive: true, imageUrl: 'img', title: 'tt' } as any],
    });

    const prisma = mapper.toPrisma(b);
    expect(prisma.name).toBe('x');
    expect(prisma.order).toBe(2);

    const trans = mapper.toPrismaTranslations(b);
    expect(trans).toHaveLength(1);
    expect(trans[0].language).toBe(Language.KO);
    expect(trans[0].imageUrl).toBe('img');
  });
});
