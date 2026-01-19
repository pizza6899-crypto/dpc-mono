import { Body, Controller, Delete, Get, Param, Patch, Post, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { FindCategoriesService } from '../../application/find-categories.service';
import { CreateCategoryService } from '../../application/create-category.service';
import { UpdateCategoryService } from '../../application/update-category.service';
import { DeleteCategoryService } from '../../application/delete-category.service';
import { CreateCategoryAdminRequestDto } from './dto/request/create-category.request.dto';
import { UpdateCategoryAdminRequestDto } from './dto/request/update-category.request.dto';
import { CategoryAdminResponseDto } from './dto/response/category-admin.response.dto';

import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { ApiPaginatedResponse, ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { PaginationQueryDto } from 'src/common/http/types';
import { CasinoGameCategory } from '../../domain';

@ApiTags('Admin Casino Category')
@Controller('admin/casino/categories')
@Admin()
export class CategoryAdminController {
    constructor(
        private readonly findCategoriesService: FindCategoriesService,
        private readonly createCategoryService: CreateCategoryService,
        private readonly updateCategoryService: UpdateCategoryService,
    ) { }

    @Get()
    @Paginated()
    @ApiOperation({
        summary: 'List all categories (Admin) / 모든 카테고리 목록 조회 (관리자)',
        description: 'Retrieves a paginated list of all casino game categories with administrative details. / 관리자 측면에서의 모든 카지노 게임 카테고리 목록을 페이징하여 조회합니다.'
    })
    @ApiPaginatedResponse(CategoryAdminResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CASINO',
        action: 'CATEGORY_LIST_ADMIN',
        extractMetadata: (req, args) => ({
            query: args[0],
        }),
    })
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
    @ApiOperation({
        summary: 'Create a new category / 신규 카테고리 생성',
        description: 'Creates a new casino game category with translations and optional file attachments. / 번역 정보와 파일 첨부를 포함한 새로운 카지노 게임 카테고리를 생성합니다.'
    })
    @ApiStandardResponse(CategoryAdminResponseDto, { status: HttpStatus.CREATED })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CASINO',
        action: 'CATEGORY_CREATE_ADMIN',
        extractMetadata: (req, args, result: CategoryAdminResponseDto) => ({
            id: result?.id,
            code: result?.code,
            type: result?.type,
        }),
    })
    async create(@Body() dto: CreateCategoryAdminRequestDto): Promise<CategoryAdminResponseDto> {
        const category = await this.createCategoryService.execute(dto);
        return this.toResponseDto(category);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update a category / 카테고리 정보 수정',
        description: 'Updates an existing category identified by its internal ID. / 내부 ID로 식별된 기존 카테고리 정보를 수정합니다.'
    })
    @ApiStandardResponse(CategoryAdminResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CASINO',
        action: 'CATEGORY_UPDATE_ADMIN',
        extractMetadata: (req, args, result: CategoryAdminResponseDto) => ({
            id: args[0],
            updates: args[1],
        }),
    })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCategoryAdminRequestDto
    ): Promise<CategoryAdminResponseDto> {
        const category = await this.updateCategoryService.execute({
            ...dto,
            id: BigInt(id),
        });
        return this.toResponseDto(category);
    }

    private toResponseDto(cat: CasinoGameCategory): CategoryAdminResponseDto {
        return {
            id: cat.id?.toString() || '',
            code: cat.code,
            type: cat.type,
            isActive: cat.isActive,
            isSystem: cat.isSystem,
            sortOrder: cat.sortOrder,
            iconUrl: cat.iconUrl ?? undefined,
            bannerUrl: cat.bannerUrl ?? undefined,
            translations: cat.translations.map(t => ({
                language: t.language,
                name: t.name,
                description: t.description ?? undefined,
            })),
        };
    }
}
