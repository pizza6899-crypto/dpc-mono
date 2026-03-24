import { ApiProperty } from '@nestjs/swagger';
import { ItemSlot } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class EquipInventoryItemRequestDto {
  @ApiProperty({ description: 'Inventory ID of the item to equip / 장착할 아이템의 인벤토리 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  inventoryId: string;

  @ApiProperty({ description: 'Slot to equip the item to (e.g. ARTIFACT_1, ARTIFACT_2) / 장착할 슬롯', enum: ItemSlot })
  @IsEnum(ItemSlot)
  @IsNotEmpty()
  slot: ItemSlot;
}