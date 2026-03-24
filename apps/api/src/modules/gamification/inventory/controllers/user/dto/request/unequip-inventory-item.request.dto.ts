import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UnequipInventoryItemRequestDto {
  @ApiProperty({ description: 'Inventory ID of the item to unequip / 장착 해제할 아이템의 인벤토리 ID', example: 'inv_abc123' })

  @IsString()
  @IsNotEmpty()
  inventoryId: string;
}
