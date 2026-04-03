import { Test } from '@nestjs/testing';
import { BannerAdminController } from './banner-admin.controller';
import { FindBannersService } from '../../application/find-banners.service';
import { CreateBannerService } from '../../application/create-banner.service';
import { UpdateBannerService } from '../../application/update-banner.service';
import { DeleteBannerService } from '../../application/delete-banner.service';
import { GetBannerByIdService } from '../../application/get-banner-by-id.service';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { Banner } from '../../domain/banner.entity';
import { Language } from '@prisma/client';
import { BannerInvalidImageFileIdException } from '../../domain/banner.errors';

describe('BannerAdminController', () => {
  let controller: BannerAdminController;

  const mockFind = { execute: jest.fn() } as any;
  const mockCreate = { execute: jest.fn() } as any;
  const mockUpdate = { execute: jest.fn() } as any;
  const mockDelete = { execute: jest.fn() } as any;
  const mockGet = { execute: jest.fn() } as any;
  const mockSqids = { decode: jest.fn() } as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [BannerAdminController],
      providers: [
        { provide: FindBannersService, useValue: mockFind },
        { provide: CreateBannerService, useValue: mockCreate },
        { provide: UpdateBannerService, useValue: mockUpdate },
        { provide: DeleteBannerService, useValue: mockDelete },
        { provide: GetBannerByIdService, useValue: mockGet },
        { provide: SqidsService, useValue: mockSqids },
      ],
    }).compile();

    controller = module.get(BannerAdminController);
    jest.clearAllMocks();
  });

  it('list returns paginated mapped DTO', async () => {
    const b = Banner.create({ id: 1n, name: 'n', translations: [{ language: Language.EN, isActive: true, imageUrl: 'u' } as any] });
    mockFind.execute.mockResolvedValue({ data: [b], page: 1, limit: 20, total: 1 });

    const res = await controller.list({ page: 1, limit: 20 } as any);

    expect(mockFind.execute).toHaveBeenCalled();
    expect(res.data[0].id).toBe('1');
    expect(res.total).toBe(1);
  });

  it('get returns mapped dto', async () => {
    const b = Banner.create({ id: 2n, name: 'x', translations: [] });
    mockGet.execute.mockResolvedValue(b);

    const res = await controller.get('2');
    expect(mockGet.execute).toHaveBeenCalledWith(BigInt('2'));
    expect(res.id).toBe('2');
  });

  it('create decodes sqids and returns dto', async () => {
    const dto: any = { translations: [{ language: Language.EN, isActive: true, imageFileId: 'encoded' }] };
    mockSqids.decode.mockReturnValue(10n);
    const created = Banner.create({ id: 10n, translations: [{ language: Language.EN, isActive: true, imageUrl: 'u' } as any] });
    mockCreate.execute.mockResolvedValue(created);

    const res = await controller.create(dto);

    expect(mockSqids.decode).toHaveBeenCalled();
    expect(mockCreate.execute).toHaveBeenCalled();
    expect(res.id).toBe('10');
  });

  it('create throws BannerInvalidImageFileIdException when decode fails', async () => {
    const dto: any = { translations: [{ language: Language.EN, isActive: true, imageFileId: 'bad' }] };
    mockSqids.decode.mockImplementation(() => { throw new Error('bad'); });

    await expect(controller.create(dto)).rejects.toThrow(BannerInvalidImageFileIdException);
  });

  it('update decodes sqids and calls update service', async () => {
    const dto: any = { translations: [{ language: Language.EN, isActive: true, imageFileId: 'enc' }] };
    mockSqids.decode.mockReturnValue(5n);
    const updated = Banner.create({ id: 5n, translations: [{ language: Language.EN, isActive: true, imageUrl: 'u' } as any] });
    mockUpdate.execute.mockResolvedValue(updated);

    const res = await controller.update('5', dto);
    expect(mockUpdate.execute).toHaveBeenCalled();
    expect(res.id).toBe('5');
  });

  it('delete calls delete service', async () => {
    await controller.delete('7');
    expect(mockDelete.execute).toHaveBeenCalledWith(BigInt('7'));
  });
});
