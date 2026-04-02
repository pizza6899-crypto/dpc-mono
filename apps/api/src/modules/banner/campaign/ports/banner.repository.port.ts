import type { Language } from '@prisma/client';
import type { Banner as DomainBanner } from '../domain/banner.entity';
export type Banner = DomainBanner;

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
    includeDeleted?: boolean;
  }): Promise<Banner[]>;
  count(options?: { isActive?: boolean; now?: Date; includeDeleted?: boolean }): Promise<number>;
  create(banner: Banner): Promise<Banner>;
  update(banner: Banner): Promise<Banner>;
  delete(id: bigint): Promise<void>;
}
