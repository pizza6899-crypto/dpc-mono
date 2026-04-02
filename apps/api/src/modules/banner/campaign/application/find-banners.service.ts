import { Inject, Injectable } from '@nestjs/common';
import { BANNER_REPOSITORY, type Banner } from '../ports';
import type { BannerRepositoryPort } from '../ports';
import { PaginatedData } from 'src/common/http/types';

interface FindBannersParams {
  isActive?: boolean;
  language?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class FindBannersService {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly repository: BannerRepositoryPort,
  ) {}

  async execute({ isActive, language, page = 1, limit = 20 }: FindBannersParams = {}): Promise<PaginatedData<Banner>> {
    const offset = (page - 1) * limit;
    const now = new Date();

    const [data, total] = await Promise.all([
      this.repository.list({ isActive, language, now, limit, offset }),
      this.repository.count({ isActive, now }),
    ]);

    return { data, page, limit, total };
  }
}
