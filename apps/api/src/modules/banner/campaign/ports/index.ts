import type { Language } from '@prisma/client';
import type { Banner, BannerTranslation } from '../domain/banner.entity';

export const BANNER_REPOSITORY = 'BANNER_REPOSITORY';

export interface BannerRepositoryPort {
  findById(id: bigint): Promise<Banner | null>;
  getById(id: bigint): Promise<Banner>;
  list(options?: {
    isActive?: boolean;
    language?: Language;
    now?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Banner[]>;
  count(options?: { isActive?: boolean; now?: Date }): Promise<number>;
  create(banner: Banner): Promise<Banner>;
  update(banner: Banner): Promise<Banner>;
  delete(id: bigint): Promise<void>;
}
