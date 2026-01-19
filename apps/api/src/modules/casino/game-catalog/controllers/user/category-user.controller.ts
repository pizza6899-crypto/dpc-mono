import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { FindCategoriesService } from '../../application/find-categories.service';
import { CategoryResponseDto } from './dto/response/category.response.dto';
import { PaginatedData, PaginationQueryDto } from 'src/common/http/types';

@ApiTags('Casino Category')
@Controller('casino/categories')
export class CategoryUserController {
    constructor(private readonly findCategoriesService: FindCategoriesService) { }

    @Get()
    @Public()
    @Paginated()
    @ApiOperation({ summary: 'List active categories / 활성 카테고리 목록 조회' })
    @ApiPaginatedResponse(CategoryResponseDto)
    async list(@Query() query: PaginationQueryDto): Promise<PaginatedData<CategoryResponseDto>> {
        const result = await this.findCategoriesService.execute({
            isActive: true,
            page: query.page,
            limit: query.limit,
        });

        return {
            data: result.data.map(cat => ({
                code: cat.code,
                type: cat.type,
                iconUrl: cat.iconUrl ?? undefined,
                bannerUrl: cat.bannerUrl ?? undefined,
                translations: cat.translations.map(t => ({
                    language: t.language,
                    name: t.name,
                    description: t.description ?? undefined,
                })),
            })),
            page: result.page,
            limit: result.limit,
            total: result.total,
        };
    }
}
