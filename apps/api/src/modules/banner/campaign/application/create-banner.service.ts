import { Inject, Injectable } from '@nestjs/common';
import { BANNER_REPOSITORY } from '../ports/banner.repository.port';
import type { BannerRepositoryPort } from '../ports/banner.repository.port';
import { Banner } from '../domain/banner.entity';

@Injectable()
export class CreateBannerService {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly repository: BannerRepositoryPort,
  ) {}

  async execute(params: {
    name?: string | null;
    isActive?: boolean;
    order?: number;
    linkUrl?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    translations: Array<any>;
  }): Promise<InstanceType<typeof Banner>> {
    const banner = Banner.create({
      id: params.id as any,
      name: params.name ?? null,
      isActive: params.isActive ?? true,
      order: params.order ?? 0,
      linkUrl: params.linkUrl ?? null,
      startDate: params.startDate ?? null,
      endDate: params.endDate ?? null,
      translations: params.translations ?? [],
      createdAt: null,
      updatedAt: null,
    });

    return this.repository.create(banner);
  }
}
