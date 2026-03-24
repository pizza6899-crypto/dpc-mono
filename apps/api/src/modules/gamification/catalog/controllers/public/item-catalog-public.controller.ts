import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType, Language } from '@prisma/client';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { GetItemCatalogDetailService } from '../../application/get-item-catalog-detail.service';
import { ItemCatalogPublicResponseDto } from './dto/response/item-catalog-public.response.dto';
import { ItemCatalog } from '../../domain/item-catalog.entity';

@ApiTags('User Gamification Catalog')
@Controller('gamification/items')
@RequireRoles(UserRoleType.USER)
export class ItemCatalogPublicController {
  constructor(
    private readonly getDetailService: GetItemCatalogDetailService,
    private readonly sqidsService: SqidsService,
  ) { }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Item Detail / 아이템 상세 정보 조회',
    description: 'Retrieves catalog details for a specific item using its ID. / 아이템 ID를 사용하여 카탈로그 정보를 조회합니다.',
  })
  @ApiStandardResponse(ItemCatalogPublicResponseDto)
  async getItemDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ItemCatalogPublicResponseDto> {
    const rawId = this.sqidsService.decode(id, SqidsPrefix.ITEM);
    const item = await this.getDetailService.execute(rawId);

    return this.mapToResponse(item, user.language);
  }

  private mapToResponse(i: ItemCatalog, language: Language): ItemCatalogPublicResponseDto {
    const translation = i.translations.find(t => t.language === language) || i.translations[0];

    return {
      id: this.sqidsService.encode(i.id, SqidsPrefix.ITEM),
      code: i.code,
      type: i.type,
      name: translation?.name ?? 'Unknown',
      description: translation?.description ?? null,
      effects: i.effects.map(e => ({
        type: e.type,
        value: e.value,
        target: e.target,
      })),
      price: i.price.toString(),
      priceCurrency: i.priceCurrency,
      durationDays: i.durationDays,
    };
  }
}
