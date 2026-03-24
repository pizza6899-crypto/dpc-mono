import { ApiProperty } from '@nestjs/swagger';
import { InventoryStatus, ItemSlot } from '@prisma/client';
import { ItemEffectAdminResponseDto } from './item-effect-admin.response.dto';

/**
 * [Admin] 유저 인벤토리 상세 응답 DTO
 */
export class UserInventoryAdminResponseDto {
  @ApiProperty({ description: 'Inventory Entry ID / 인벤토리 ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'User ID / 소유자 유저 ID', example: '1' })
  userId: string;

  @ApiProperty({ description: 'Item Catalog ID / 아이템 카탈로그 ID', example: '1' })
  itemId: string;

  @ApiProperty({ description: 'Quantity / 보유 수량', example: 1 })
  quantity: number;

  @ApiProperty({ description: 'Inventory Status / 상태', enum: InventoryStatus })
  status: InventoryStatus;

  @ApiProperty({ description: 'Equipped Slot / 장착 슬롯', enum: ItemSlot, required: false })
  slot: ItemSlot | null;

  @ApiProperty({ type: [ItemEffectAdminResponseDto], description: 'Effect data (from catalog) / 아이템 효과 데이터' })
  effects?: ItemEffectAdminResponseDto[];


  @ApiProperty({ description: 'Activated date / 활성화 일시', required: false })
  activatedAt: Date | null;

  @ApiProperty({ description: 'Expiry date / 만료 예정 일시', required: false })
  expiresAt: Date | null;

  @ApiProperty({ description: 'Created date / 생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date / 최근 수정 일시' })
  updatedAt: Date;
}

