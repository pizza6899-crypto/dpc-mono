import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiPaginatedResponse, ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { type PaginatedData } from 'src/common/http/types/pagination.types';

import { GetItemCatalogListService } from '../../application/get-item-catalog-list.service';
import { UpdateItemCatalogService } from '../../application/update-item-catalog.service';
import { GetItemCatalogAdminQueryDto } from './dto/request/get-item-catalog-admin-query.dto';
import { SaveItemCatalogAdminRequestDto } from './dto/request/save-item-catalog-admin.request.dto';
import { ItemCatalogAdminResponseDto } from './dto/response/item-catalog-admin.response.dto';
import { ItemCatalog } from '../../domain/item-catalog.entity';

@Controller('admin/gamification/items')
@ApiTags('Admin Gamification Item Catalog')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class ItemCatalogAdminController {
  constructor(
    private readonly getListService: GetItemCatalogListService,
    private readonly updateService: UpdateItemCatalogService,
  ) { }

  @Get()
  @Paginated()
  @ApiOperation({
    summary: 'Get Items Catalog / 아이템 카탈로그 목록 조회',
    description: 'Retrieves items in the catalog for administration with pagination. / 관리를 위한 아이템 카탈로그 목록을 페이지네이션하여 조회합니다.',
  })
  @ApiPaginatedResponse(ItemCatalogAdminResponseDto)
  async getItems(
    @Query() query: GetItemCatalogAdminQueryDto,
  ): Promise<PaginatedData<ItemCatalogAdminResponseDto>> {
    const list = await this.getListService.execute(query);
    return {
      data: list.data.map((i) => this.mapToResponseDto(i)),
      total: list.total,
      page: list.page,
      limit: list.limit,
    };
  }

  @Post()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'GAMIFICATION',
    action: 'SAVE_ITEM',
    extractMetadata: (req) => ({
      payload: req.body,
    }),
  })
  @ApiOperation({
    summary: 'Create or Update Item / 아이템 생성 및 수정',
    description: 'Stores or updates an item in the catalog. / 카탈로그에 아이템을 저장하거나 수정합니다.',
  })
  @ApiStandardResponse(ItemCatalogAdminResponseDto)
  async saveItem(
    @Body() dto: SaveItemCatalogAdminRequestDto,
  ): Promise<ItemCatalogAdminResponseDto> {
    const item = await this.updateService.execute({
      ...dto,
      id: dto.id ? BigInt(dto.id) : undefined,
    });

    return this.mapToResponseDto(item);
  }

  private mapToResponseDto(i: ItemCatalog): ItemCatalogAdminResponseDto {
    return {
      id: i.id.toString(),
      code: i.code,
      type: i.type,
      effects: i.effects.map((e) => ({
        type: e.type,
        value: e.value,
        target: e.target,
      })),
      price: i.price.toString(),
      priceCurrency: i.priceCurrency,
      durationDays: i.durationDays,
      translations: i.translations.map((t) => ({
        language: t.language,
        name: t.name,
        description: t.description,
      })),
      updatedAt: i.updatedAt,
    };
  }
}
