import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { FindBannersService } from '../../application/find-banners.service';
import { BannerResponseDto } from './dto/response/banner.response.dto';
import { BannerListQueryDto } from './dto/request/banner-list.query.dto';
import { Language } from '@prisma/client';

@ApiTags('Public Banners')
@Public()
@Controller('public/banners')
export class BannerPublicController {
  constructor(private readonly findBannersService: FindBannersService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List banners for current language / 언어별 배너 조회' })
  @ApiOkResponse({ type: BannerResponseDto, isArray: true })
  async list(@Query() query: BannerListQueryDto): Promise<BannerResponseDto[]> {
    const language = query.language || Language.EN;

    const result = await this.findBannersService.execute({
      isActive: true,
      language,
    });

    const banners = Array.isArray(result) ? result : result.data;

    return banners.map((banner) => {
      const translation =
        banner.translations.find((t) => t.language === language && t.isActive) ||
        banner.translations.find((t) => t.language === Language.EN && t.isActive) ||
        banner.translations.find((t) => t.isActive) ||
        null;

      return {
        order: banner.order,
        linkUrl: banner.linkUrl ?? undefined,
        imageUrl: translation?.imageUrl ?? undefined,
        title: translation?.title ?? undefined,
        altText: translation?.altText ?? undefined,
      };
    });
  }
}
