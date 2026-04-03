import { Inject, Injectable } from '@nestjs/common';
import { BANNER_REPOSITORY, type Banner } from '../ports/banner.repository.port';
import type { BannerRepositoryPort } from '../ports/banner.repository.port';
import { PaginatedData } from 'src/common/http/types';
import type { Language } from '@prisma/client';

interface FindBannersParams {
  isActive?: boolean;
  language?: Language;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
  includeTime?: boolean;
  search?: string | undefined;
  startDateFrom?: string | undefined;
  startDateTo?: string | undefined;
  endDateFrom?: string | undefined;
  endDateTo?: string | undefined;
}

@Injectable()
export class FindBannersService {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly repository: BannerRepositoryPort,
  ) {}
  async execute({ isActive, language, page = 1, limit = 20, includeDeleted = false, includeTime = false, search, startDateFrom, startDateTo, endDateFrom, endDateTo }: FindBannersParams = {}): Promise<PaginatedData<Banner>> {
    const offset = (page - 1) * limit;
    const now = includeTime ? new Date() : undefined;

    const [data, total] = await Promise.all([
      this.repository.list({
        isActive,
        language,
        now,
        limit,
        offset,
        includeDeleted,
        search,
        startDateFrom: startDateFrom ? new Date(startDateFrom) : undefined,
        startDateTo: startDateTo ? new Date(startDateTo) : undefined,
        endDateFrom: endDateFrom ? new Date(endDateFrom) : undefined,
        endDateTo: endDateTo ? new Date(endDateTo) : undefined,
      }),
      this.repository.count({
        isActive,
        now,
        includeDeleted,
        search,
        startDateFrom: startDateFrom ? new Date(startDateFrom) : undefined,
        startDateTo: startDateTo ? new Date(startDateTo) : undefined,
        endDateFrom: endDateFrom ? new Date(endDateFrom) : undefined,
        endDateTo: endDateTo ? new Date(endDateTo) : undefined,
      }),
    ]);

    return { data, page, limit, total };
  }
}
