import { ApiProperty } from '@nestjs/swagger';
import { InventoryAction, ItemSlot } from '@prisma/client';
import { AnyInventoryLogMetadata } from '../../../../domain/user-inventory-log-metadata';

/**
 * [Admin] 인벤토리 활동 로그 응답 DTO
 */
export class InventoryLogAdminResponseDto {
  @ApiProperty({ description: 'Log ID / 로그 ID', example: '1029384756' })
  id: string;

  @ApiProperty({ description: 'Inventory ID / 인벤토리 ID', example: '1' })
  inventoryId: string;

  @ApiProperty({ description: 'User ID / 유저 ID', example: '500' })
  userId: string;

  @ApiProperty({ description: 'Item Catalog ID / 아이템 카탈로그 ID', example: '10' })
  itemId: string;

  @ApiProperty({ description: 'Activity Action / 활동 액션', enum: InventoryAction, example: InventoryAction.GRANT })
  action: InventoryAction;

  @ApiProperty({ description: 'Target Slot / 대상 슬롯', enum: ItemSlot, nullable: true, example: ItemSlot.ARTIFACT_1 })
  slot: ItemSlot | null;

  @ApiProperty({ description: 'Usage Count (Before) / 변경 전 사용 횟수', nullable: true, example: 5 })
  previousUsageCount: number | null;

  @ApiProperty({ description: 'Usage Count (After) / 변경 후 사용 횟수', nullable: true, example: 4 })
  currentUsageCount: number | null;

  @ApiProperty({ description: 'Actor ID (Admin ID etc.) / 행위자 ID (관리자 ID 등)', nullable: true, example: 'admin_01' })
  actorId: string | null;

  @ApiProperty({ description: 'Comment or Reason / 활동 사유 및 메모', nullable: true, example: 'Daily rewarding' })
  reason: string | null;

  @ApiProperty({ description: 'Detailed Metadata (JSON) / 상세 메타데이터', nullable: true, example: { prev_qty: 1, curr_qty: 1 } })
  metadata: AnyInventoryLogMetadata | null;

  @ApiProperty({ description: 'Logged At / 로그 생성 일시', example: '2026-03-24T18:00:00Z' })
  createdAt: Date;
}
