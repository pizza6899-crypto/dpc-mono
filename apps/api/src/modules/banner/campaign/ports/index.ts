import type { Language } from '@prisma/client';

export const BANNER_REPOSITORY = 'BANNER_REPOSITORY';

export interface BannerTranslation {
  id?: bigint | null;
  language: Language;
  isActive: boolean;
  imageUrl?: string | null;
  title?: string | null;
  altText?: string | null;
  description?: string | null;
  linkUrl?: string | null;
}

export interface Banner {
  id?: bigint | null;
  name?: string | null;
  isActive?: boolean;
  order?: number;
  linkUrl?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  deletedAt?: Date | null;
  translations?: BannerTranslation[];
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

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
