import { Banner } from './banner.entity';
import { Language } from '@prisma/client';

describe('Banner entity', () => {
  it('create should set defaults', () => {
    const b = Banner.create({});
    expect(b.id).toBeNull();
    expect(b.name).toBeNull();
    expect(b.isActive).toBe(true);
    expect(b.order).toBe(0);
    expect(Array.isArray(b.translations)).toBe(true);
    expect(b.translations.length).toBe(0);
  });

  it('update should only change provided fields', () => {
    const b = Banner.create({
      id: 10n,
      name: 'orig',
      isActive: true,
      order: 1,
      linkUrl: 'a',
      translations: [{ language: Language.EN, isActive: true, title: 't' }],
    });

    b.update({ name: 'new', order: 5 });

    expect(b.name).toBe('new');
    expect(b.order).toBe(5);
    // unchanged
    expect(b.linkUrl).toBe('a');
    expect(b.isActive).toBe(true);
    expect(b.translations.length).toBe(1);
  });

  it('update replaces translations when provided', () => {
    const b = Banner.create({ translations: [{ language: Language.EN, isActive: true, title: 't1' }] });
    b.update({ translations: [{ language: Language.KO, isActive: false, title: 't2' }] as any });
    expect(b.translations.length).toBe(1);
    expect(b.translations[0].language).toBe(Language.KO);
    expect(b.translations[0].isActive).toBe(false);
  });
});
