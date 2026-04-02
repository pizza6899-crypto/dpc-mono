import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { FindBannersService } from '../../application/find-banners.service';
import { BannerListRequestDto } from './dto/request/banner-list.request.dto';
import { BannerResponseDto } from './dto/response/banner.response.dto';
import { PaginatedData } from 'src/common/http/types';
import { Language } from '@prisma/client';

@ApiTags('User Banners')
@Controller('banners')
export class BannerUserController {
  constructor(private readonly findBannersService: FindBannersService) {}

  @Get()
  @Public()
  @Paginated()
  @ApiOperation({ summary: 'List banners for current language / 언어별 배너 조회' })
  @ApiPaginatedResponse(BannerResponseDto)
  async list(
    @Query() query: BannerListRequestDto,
  ): Promise<PaginatedData<BannerResponseDto>> {
    const language = query.language || Language.EN;
    const result = await this.findBannersService.execute({
      isActive: true,
      language,
      page: query.page,
      limit: query.limit,
    });

    return {
      data: result.data.map((banner) => {
        const translation =
          banner.translations.find((t) => t.language === language && t.isActive) ||
          banner.translations.find((t) => t.language === Language.EN && t.isActive) ||
          banner.translations.find((t) => t.isActive) ||
          null;

        return {
          id: banner.id?.toString() ?? '',
          name: banner.name ?? undefined,
          isActive: banner.isActive,
          order: banner.order,
          linkUrl: banner.linkUrl ?? undefined,
          translations: banner.translations.map((t) => ({
            language: t.language,
            isActive: t.isActive,
            imageUrl: t.imageUrl ?? undefined,
            title: t.title ?? undefined,
            altText: t.altText ?? undefined,
            description: t.description ?? undefined,
            linkUrl: t.linkUrl ?? undefined,
          })),
        };
      }),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }
}
