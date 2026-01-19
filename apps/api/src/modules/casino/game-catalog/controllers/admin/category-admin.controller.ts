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
import { CategoryAdminResponseDto } from './dto/response/category-admin.response.dto';

import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { PaginatedData, PaginationQueryDto } from 'src/common/http/types';

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
    @Paginated()
    @ApiOperation({ summary: 'List all categories (Admin) / 모든 카테고리 목록 조회 (관리자)' })
    @ApiPaginatedResponse(CategoryAdminResponseDto) // Assuming we use a similar response DTO
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'CATEGORY_LIST_ADMIN' })
    async list(@Query() query: PaginationQueryDto) {
        const result = await this.findCategoriesService.execute({
            page: query.page,
            limit: query.limit,
        });

        return {
            data: result.data.map((cat) => this.toResponseDto(cat)),
            page: result.page,
            limit: result.limit,
            total: result.total,
        };
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
