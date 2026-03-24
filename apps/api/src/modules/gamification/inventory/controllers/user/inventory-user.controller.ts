import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags, ApiProperty } from '@nestjs/swagger';
import { InventoryStatus, ItemSlot, ItemType, UserRoleType, Language } from '@prisma/client';

import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

// Sqids
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

// Services
import { FindUserInventoryService } from '../../application/find-user-inventory.service';
import { EquipInventoryItemService } from '../../application/equip-inventory-item.service';
import { UnequipInventoryItemService } from '../../application/unequip-inventory-item.service';

// DTOs
import { EquipInventoryItemRequestDto } from './dto/request/equip-inventory-item.request.dto';
import { UnequipInventoryItemRequestDto } from './dto/request/unequip-inventory-item.request.dto';
import { UserInventoryResponseDto } from './dto/response/user-inventory.response.dto';
import { UserInventoryDto } from '../../ports/user-inventory.repository.port';

@ApiTags('User Gamification Inventory')
@Controller('gamification/inventory')
@RequireRoles(UserRoleType.USER)
export class InventoryUserController {
  constructor(
    private readonly findInventoryService: FindUserInventoryService,
    private readonly equipItemService: EquipInventoryItemService,
    private readonly unequipItemService: UnequipInventoryItemService,
    private readonly sqidsService: SqidsService,
  ) { }

  @Get('me')
  @ApiOperation({
    summary: 'My Inventory / 내 인벤토리 조회',
    description: 'Returns the list of items owned by the current user. Optionally filter by status. / 현재 사용자 소유의 아이템 목록을 반환합니다. 필요한 경우 상태로 필터링할 수 있습니다.',
  })
  @ApiQuery({ name: 'status', enum: InventoryStatus, required: false, description: 'Status filter (ACTIVE, PENDING, etc.) / 상태 필터 (ACTIVE, PENDING 등)' })
  @ApiStandardResponse(UserInventoryResponseDto, { isArray: true })
  async getMyInventory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: InventoryStatus,
  ): Promise<UserInventoryResponseDto[]> {
    const list = await this.findInventoryService.execute({
      userId: user.id,
      status,
    });

    return list.map(item => this.mapToResponse(item, user.language));
  }

  @Post('equip')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'GAMIFICATION',
    action: 'EQUIP_ITEM',
    extractMetadata: (req) => req.body,
  })
  @ApiOperation({
    summary: 'Equip Artifact/Item / 아이템 장착',
    description: 'Equips an item to a specific artifact slot. Automatically unequips any existing item in that slot and syncs user stats. / 아이템을 지정된 슬롯에 장착합니다. 해당 슬롯에 기존 아이템이 있는 경우 자동으로 해제되며 사용자의 스탯이 동기화됩니다.',
  })
  async equipItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EquipInventoryItemRequestDto,
  ): Promise<void> {
    await this.equipItemService.execute({
      userId: user.id,
      inventoryId: this.sqidsService.decode(dto.inventoryId, SqidsPrefix.INVENTORY),
      slot: dto.slot,
    });
  }

  @Post('unequip')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'GAMIFICATION',
    action: 'UNEQUIP_ITEM',
    extractMetadata: (req) => req.body,
  })
  @ApiOperation({
    summary: 'Unequip Artifact/Item / 아이템 장착 해제',
    description: 'Unequips a currently active item from its slot and syncs user stats. / 현재 장착된 아이템의 장착을 해제하고 사용자의 스탯을 동기화합니다.',
  })
  async unequipItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UnequipInventoryItemRequestDto,
  ): Promise<void> {
    await this.unequipItemService.execute({
      userId: user.id,
      inventoryId: this.sqidsService.decode(dto.inventoryId, SqidsPrefix.INVENTORY),
    });
  }

  private mapToResponse(d: UserInventoryDto, language: Language): UserInventoryResponseDto {
    const translation = d.translations.find(t => t.language === language) || d.translations[0];

    return {
      id: this.sqidsService.encode(d.id, SqidsPrefix.INVENTORY),
      itemId: this.sqidsService.encode(d.itemId, SqidsPrefix.ITEM),
      name: translation?.name ?? 'Unknown',
      description: translation?.description ?? null,
      itemType: d.itemType,

      quantity: d.quantity,
      status: d.status,
      slot: d.slot as ItemSlot || null,
      effects: d.effects,
      activatedAt: d.activatedAt,
      remainingUsageCount: d.remainingUsageCount,
    };
  }

}

