import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { FindCategoriesService } from '../../application/find-categories.service';
import { CategoryResponseDto } from './dto/response/category.response.dto';
import { CategoryListRequestDto } from './dto/request/category-list.request.dto';
import { PaginatedData } from 'src/common/http/types';
import { Language } from '@prisma/client';

@ApiTags('User Casino Category')
@Controller('casino/categories')
export class CategoryUserController {
    constructor(private readonly findCategoriesService: FindCategoriesService) { }

    @Get()
    @Public()
    @Paginated()
    @ApiOperation({ summary: 'List active categories / 활성 카테고리 목록 조회' })
    @ApiPaginatedResponse(CategoryResponseDto)
    async list(@Query() query: CategoryListRequestDto): Promise<PaginatedData<CategoryResponseDto>> {
        const lang = query.language || Language.EN;
        const result = await this.findCategoriesService.execute({
            isActive: true, // Only active categories for users
            page: query.page,
            limit: query.limit,
        });

        return {
            data: result.data.map(cat => {
                const translation =
                    cat.translations.find(t => t.language === lang) ||
                    cat.translations.find(t => t.language === Language.EN) ||
                    cat.translations[0];
                return {
                    code: cat.code,
                    type: cat.type,
                    name: translation?.name || cat.code,
                    description: translation?.description ?? undefined,
                    iconUrl: cat.iconUrl ?? undefined,
                    bannerUrl: cat.bannerUrl ?? undefined,
                };
            }),
            page: result.page,
            limit: result.limit,
            total: result.total,
        };
    }
}
