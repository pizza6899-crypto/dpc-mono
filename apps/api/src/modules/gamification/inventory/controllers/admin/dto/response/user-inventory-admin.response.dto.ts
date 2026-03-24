import { ApiProperty } from '@nestjs/swagger';
import { InventoryStatus, ItemSlot, ItemType } from '@prisma/client';

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

  @ApiProperty({ description: 'Item Code / 아이템 코드', example: 'SWORD_001' })
  itemCode: string;

  @ApiProperty({ description: 'Item Type / 아이템 타입', enum: ItemType })
  itemType: ItemType;

  @ApiProperty({ description: 'Item Name / 아이템 이름', example: 'Sword of Light' })
  name: string;

  @ApiProperty({ description: 'Item Description / 아이템 설명', example: 'A legendary sword.', nullable: true })
  description: string | null;


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

  @ApiProperty({ description: 'Last Used date / 최근 자동으로 소모된 일시', required: false })
  lastUsedAt: Date | null;

  @ApiProperty({ description: 'Remaining Usage Count / 남은 사용 횟수', required: false })
  remainingUsageCount: number | null;

  @ApiProperty({ description: 'Created date / 생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date / 최근 수정 일시' })
  updatedAt: Date;
}

