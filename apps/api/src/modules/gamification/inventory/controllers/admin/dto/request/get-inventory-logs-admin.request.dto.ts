import { ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryAction, ItemSlot } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/http/types/pagination.types';

/**
 * [Admin] 인벤토리 로그 조회 쿼리 DTO
 */
export class GetInventoryLogsAdminRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'User ID / 특정 유저 ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Inventory Entry ID / 특정 인벤토리 고유 ID' })
  @IsOptional()
  @IsString()
  inventoryId?: string;

  @ApiPropertyOptional({ description: 'Item Catalog ID / 특정 아이템 카탈로그 ID' })
  @IsOptional()
  @IsString()
  itemId?: string;

  @ApiPropertyOptional({ enum: InventoryAction, description: 'Inventory Action / 필터링할 인벤토리 활동 액션' })
  @IsOptional()
  @IsEnum(InventoryAction)
  action?: InventoryAction;

  @ApiPropertyOptional({ enum: ItemSlot, description: 'Equipped Slot / 필터링할 장착 슬롯' })
  @IsOptional()
  @IsEnum(ItemSlot)
  slot?: ItemSlot;

  @ApiPropertyOptional({ description: 'Search Start Time (ISO 8601) / 검색 시작 시각' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Search End Time (ISO 8601) / 검색 종료 시각' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
