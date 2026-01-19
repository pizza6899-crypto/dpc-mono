import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { FindCategoriesService } from '../../application/find-categories.service';
import { CreateCategoryService } from '../../application/create-category.service';
import { UpdateCategoryService } from '../../application/update-category.service';
import { DeleteCategoryService } from '../../application/delete-category.service';
import { CreateCategoryAdminRequestDto } from './dto/request/create-category.request.dto';

@ApiTags('Admin Casino Category')
@Controller('admin/casino/categories')
@Admin()
export class CategoryAdminController {
    constructor(
        private readonly findCategoriesService: FindCategoriesService,
        private readonly createCategoryService: CreateCategoryService,
        private readonly updateCategoryService: UpdateCategoryService,
        private readonly deleteCategoryService: DeleteCategoryService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List all categories' })
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'CATEGORY_LIST_ADMIN' })
    async list(@Query('isActive') isActive?: boolean) {
        const categories = await this.findCategoriesService.execute({ isActive });
        return categories.map((cat) => this.toResponseDto(cat));
    }

    @Post()
    @ApiOperation({ summary: 'Create a new category' })
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'CATEGORY_CREATE_ADMIN' })
    async create(@Body() dto: CreateCategoryAdminRequestDto) {
        const category = await this.createCategoryService.execute(dto);
        return this.toResponseDto(category);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a category' })
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'CATEGORY_UPDATE_ADMIN' })
    async update(@Param('id') id: string, @Body() dto: Partial<CreateCategoryAdminRequestDto>) {
        const category = await this.updateCategoryService.execute({
            ...dto,
            id: BigInt(id),
        });
        return this.toResponseDto(category);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a category' })
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'CATEGORY_DELETE_ADMIN' })
    async delete(@Param('id') id: string) {
        await this.deleteCategoryService.execute(BigInt(id));
        return { success: true };
    }

    private toResponseDto(cat: any) {
        return {
            id: cat.id?.toString(),
            code: cat.code,
            type: cat.type,
            isActive: cat.isActive,
            sortOrder: cat.sortOrder,
            iconUrl: cat.iconUrl,
            bannerUrl: cat.bannerUrl,
            translations: cat.translations,
        };
    }
}
