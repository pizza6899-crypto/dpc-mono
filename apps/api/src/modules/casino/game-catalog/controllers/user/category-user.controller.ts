import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { FindCategoriesService } from '../../application/find-categories.service';
import { CategoryResponseDto } from './dto/response/category.response.dto';

@ApiTags('Casino Category')
@Controller('casino/categories')
export class CategoryUserController {
    constructor(private readonly findCategoriesService: FindCategoriesService) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'List active categories' })
    @ApiStandardResponse(CategoryResponseDto, { isArray: true })
    async list() {
        const categories = await this.findCategoriesService.execute({ isActive: true });
        return categories.map(cat => ({
            code: cat.code,
            type: cat.type,
            iconUrl: cat.iconUrl,
            bannerUrl: cat.bannerUrl,
            translations: cat.translations,
        }));
    }
}
