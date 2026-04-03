/**
 * Integration tests for Banner module (requires Postgres test DB)
 *
 * - Requires `TEST_DATABASE_URL` or `DATABASE_URL` to be set.
 * - Ensure schema/migrations are applied before running tests.
 */

import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Language } from '@prisma/client';

// Static imports to avoid ESM dynamic import issues in Jest
import { BannerMapper } from 'src/modules/banner/campaign/infrastructure/banner.mapper';
import { BannerRepository } from 'src/modules/banner/campaign/infrastructure/banner.repository';
import { FindBannersService } from 'src/modules/banner/campaign/application/find-banners.service';
import { GetBannerByIdService } from 'src/modules/banner/campaign/application/get-banner-by-id.service';
import { CreateBannerService } from 'src/modules/banner/campaign/application/create-banner.service';
import { UpdateBannerService } from 'src/modules/banner/campaign/application/update-banner.service';
import { BannerTranslationService } from 'src/modules/banner/campaign/application/banner-translation.service';
import { DeleteBannerService } from 'src/modules/banner/campaign/application/delete-banner.service';
import { AttachFileService } from 'src/modules/file/application/attach-file.service';
import { FileUrlService } from 'src/modules/file/application/file-url.service';
import { BANNER_REPOSITORY } from 'src/modules/banner/campaign/ports/banner.repository.port';

const shouldRun = Boolean(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);

if (!shouldRun) {
  describe.skip('BannerRepository integration (DB required)', () => {
    it('skipped because TEST_DATABASE_URL/DATABASE_URL is not set', () => {
      // noop
    });
  });
} else {
  describe('Banner module integration (requires DB)', () => {
    let app: any;
    let prisma: PrismaService;
    let createBannerService: CreateBannerService;
    let repository: any;
    let moduleRef: any;

    beforeAll(async () => {
      // Ensure PrismaModule reads TEST_DATABASE_URL when present
      if (process.env.TEST_DATABASE_URL) {
        process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
      }

      const mockAttach = { execute: jest.fn().mockResolvedValue(undefined) } as Partial<AttachFileService>;
      const mockFileUrl = {
        async getUrlsByFileIds(ids: bigint[]) {
          return new Map<string, string | null>([[String(ids[0]), 'http://example.test/1']]);
        },
      } as Partial<FileUrlService>;

      moduleRef = await Test.createTestingModule({
        imports: [PrismaModule],
        providers: [
          // Banner providers (mirror of BannerCampaignModule but with file services mocked)
          BannerMapper,
          { provide: BANNER_REPOSITORY, useClass: BannerRepository },
          FindBannersService,
          GetBannerByIdService,
          CreateBannerService,
          UpdateBannerService,
          BannerTranslationService,
          DeleteBannerService,
          // mocked file services
          { provide: AttachFileService, useValue: mockAttach },
          { provide: FileUrlService, useValue: mockFileUrl },
        ],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      prisma = moduleRef.get(PrismaService);
      await prisma.$connect();

      createBannerService = moduleRef.get(CreateBannerService);
      repository = moduleRef.get(BANNER_REPOSITORY as any);
      // Debug: ensure our mocked FileUrlService was injected
      const injectedFileUrl = moduleRef.get(FileUrlService as any);
    }, 30000);

    afterAll(async () => {
      try {
        await prisma.$disconnect();
      } catch (e) {
        // ignore
      }
      if (app) await app.close();
    });

    it('creates a banner and reads it back via repository', async () => {
      const params: any = {
        name: 'integration-banner',
        isActive: true,
        order: 1,
        translations: [
          { language: Language.EN, isActive: true, imageFileId: 1n, title: 'Integration' },
        ],
      };

      let created: any;
      try {
        created = await createBannerService.execute(params);
      } catch (err) {
        // debug: inspect mock call state (logs removed)
        throw err;
      }

      expect(created).toBeDefined();
      expect(created.id).toBeTruthy();

      const fetched = await repository.getById(created.id as any);
      expect(fetched).toBeDefined();
      expect(fetched.name).toBe('integration-banner');
      expect(fetched.translations.length).toBeGreaterThan(0);
      expect(fetched.translations[0].imageUrl).toBe('http://example.test/1');

      // Cleanup: attempt hard delete (integration DB is expected to be disposable)
      try {
        if ((prisma as any).extended?.banner) {
          await (prisma as any).extended.banner.delete({ where: { id: created.id } });
        } else {
          await prisma.$executeRaw`DELETE FROM banners WHERE id = ${created.id}`;
        }
      } catch (e) {
        // ignore cleanup errors
      }
    });
  });
}

