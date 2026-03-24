import { ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryStatus, ItemType, Language } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

/**
 * [Admin] 유저 인벤토리 목록 조회 쿼리 DTO
 */
export class GetUserInventoryAdminQueryDto {
  @ApiPropertyOptional({ enum: Language, description: 'Display Language / 표시 언어' })
  @IsEnum(Language)
  @IsOptional()
  lang?: Language;

  @ApiPropertyOptional({ enum: InventoryStatus, description: 'Inventory Status Filter / 인벤토리 상태 필터' })
  @IsEnum(InventoryStatus)
  @IsOptional()
  status?: InventoryStatus;

  @ApiPropertyOptional({ enum: ItemType, description: 'Item Type Filter / 아이템 타입 필터' })
  @IsEnum(ItemType)
  @IsOptional()
  itemType?: ItemType;
}
