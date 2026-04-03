import { BannerRepository } from './banner.repository';
import { BannerInvalidStateException, BannerNotFoundException } from '../domain/banner.errors';
import { Language } from '@prisma/client';

describe('BannerRepository', () => {
  let repo: BannerRepository;
  let txMock: any;
  let mapperMock: any;

  beforeEach(() => {
    txMock = {
      banner: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      bannerTranslation: {
        deleteMany: jest.fn(),
      },
    };

    mapperMock = {
      toDomain: jest.fn((r) => r),
      toPrisma: jest.fn(),
      toPrismaTranslations: jest.fn(),
    };

    repo = new BannerRepository(txMock as any, mapperMock as any);
    jest.clearAllMocks();
  });

  it('list includes language in include.translations when language provided', async () => {
    const row = { id: 1n, translations: [] } as any;
    txMock.banner.findMany.mockResolvedValue([row]);

    const res = await repo.list({ isActive: true, language: Language.KO, limit: 5, offset: 2 });

    expect(txMock.banner.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
        include: { translations: { where: { language: Language.KO } } },
        orderBy: { order: 'asc' },
        take: 5,
        skip: 2,
      }),
    );
    expect(mapperMock.toDomain).toHaveBeenCalledWith(row);
    expect(res[0]).toBe(row);
  });

  it('count composes search AND clause', async () => {
    txMock.banner.count.mockResolvedValue(3);

    await repo.count({ search: 'term' });

    expect(txMock.banner.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ AND: expect.any(Array) }) }),
    );
  });

  it('create calls tx.banner.create with translations.create', async () => {
    const banner = { name: 'b' } as any;
    mapperMock.toPrisma.mockReturnValue({ name: 'b' });
    mapperMock.toPrismaTranslations.mockReturnValue([{ language: Language.EN, title: 't' }]);
    txMock.banner.create.mockResolvedValue({ id: 1n, translations: [{ id: 1, title: 't' }] });
    mapperMock.toDomain.mockReturnValue({ id: 1n });

    const res = await repo.create(banner);

    expect(txMock.banner.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'b', translations: { create: [{ language: Language.EN, title: 't' }] } }),
        include: { translations: true },
      }),
    );

    expect(res).toEqual({ id: 1n });
  });

  it('update deletes existing translations then updates with create translations', async () => {
    const banner = { id: 10n, name: 'b' } as any;
    mapperMock.toPrisma.mockReturnValue({ name: 'b' });
    mapperMock.toPrismaTranslations.mockReturnValue([{ language: Language.EN, title: 'x' }]);
    txMock.banner.update.mockResolvedValue({ id: 10n, translations: [{ id: 1 }] });
    mapperMock.toDomain.mockReturnValue({ id: 10n });

    const res = await repo.update(banner);

    expect(txMock.bannerTranslation.deleteMany).toHaveBeenCalledWith({ where: { bannerId: banner.id } });
    expect(txMock.banner.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: banner.id },
        data: expect.objectContaining({ translations: { create: [{ language: Language.EN, title: 'x' }] } }),
        include: { translations: true },
      }),
    );
    expect(res).toEqual({ id: 10n });
  });

  it('update without id throws BannerInvalidStateException', async () => {
    await expect(repo.update({ name: 'no-id' } as any)).rejects.toThrow(BannerInvalidStateException);
  });

  it('delete does soft-delete via update', async () => {
    await repo.delete(7n);
    expect(txMock.banner.update).toHaveBeenCalledWith({ where: { id: 7n }, data: { deletedAt: expect.any(Date) } });
  });

  it('findById returns null or domain', async () => {
    txMock.banner.findUnique.mockResolvedValue(null);
    const resNull = await repo.findById(1n);
    expect(resNull).toBeNull();

    const row = { id: 2n, translations: [] } as any;
    txMock.banner.findUnique.mockResolvedValue(row);
    const res = await repo.findById(2n);
    expect(mapperMock.toDomain).toHaveBeenCalledWith(row);
    expect(res).toBe(row);
  });

  it('getById throws BannerNotFoundException when not found', async () => {
    txMock.banner.findUnique.mockResolvedValue(null);
    await expect(repo.getById(9n)).rejects.toThrow(BannerNotFoundException);
  });
});
