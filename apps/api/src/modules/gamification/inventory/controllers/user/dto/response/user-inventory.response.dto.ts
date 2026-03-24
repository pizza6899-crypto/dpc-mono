import { ApiProperty } from '@nestjs/swagger';
import { InventoryStatus, ItemSlot, ItemType } from '@prisma/client';
import { ItemEffectResponseDto } from './item-effect.response.dto';

export class UserInventoryResponseDto {
  @ApiProperty({ description: 'Inventory ID / 인벤토리 ID', example: 'inv_abc123' })
  id: string;

  @ApiProperty({ description: 'Item Catalog ID / 아이템 카탈로그 ID', example: 'itm_xyz' })
  itemId: string;

  @ApiProperty({ description: 'Item Name / 아이템 이름', example: 'Sword of Light' })
  name: string;

  @ApiProperty({ description: 'Item Description / 아이템 설명', example: 'A legendary sword that glows.', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Item Type / 아이템 타입', enum: ItemType })
  itemType: ItemType;

  @ApiProperty({ description: 'Category or slot if applicable / 카테고리 또는 장착 슬롯', enum: ItemSlot, nullable: true })
  slot: ItemSlot | null;

  @ApiProperty({ description: 'Current Quantity / 현재 보유 수량', example: 1 })
  quantity: number;

  @ApiProperty({ description: 'Status of the item / 아이템 상태', enum: InventoryStatus })
  status: InventoryStatus;

  @ApiProperty({ type: [ItemEffectResponseDto], description: 'Effects from catalog (JSON array) / 카탈로그로부터의 효과 정보' })
  effects: ItemEffectResponseDto[];

  @ApiProperty({ description: 'Item is active or equipped since this time / 활성화 또는 장착 일시', required: false, nullable: true })
  activatedAt?: Date | null;

  @ApiProperty({ description: 'Item expiry date if temporary / 기간제 아이템의 경우 만료 일시', required: false, nullable: true })
  expiresAt?: Date | null;
}


