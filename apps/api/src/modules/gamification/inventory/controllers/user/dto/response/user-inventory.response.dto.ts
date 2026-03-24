import { ApiProperty } from '@nestjs/swagger';
import { InventoryStatus, ItemSlot } from '@prisma/client';
import { ItemEffectResponseDto } from './item-effect.response.dto';


export class UserInventoryResponseDto {
  @ApiProperty({ description: 'Inventory ID / 인벤토리 ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Owner User ID / 소유자 유저 ID', example: '1' })
  userId: string;

  @ApiProperty({ description: 'Item Catalog ID / 아이템 카탈로그 ID', example: '1' })
  itemId: string;

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


