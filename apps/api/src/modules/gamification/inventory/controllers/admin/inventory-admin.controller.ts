import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserRoleType, Language } from '@prisma/client';

import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';

// Application Services
import { GrantItemAdminService } from '../../application/grant-item-admin.service';
import { FindUserInventoryAdminService } from '../../application/find-user-inventory-admin.service';
import { RevokeInventoryItemAdminService } from '../../application/revoke-inventory-item-admin.service';

// DTOs
import { GrantItemAdminRequestDto } from './dto/request/grant-item-admin.request.dto';
import { UserInventoryAdminResponseDto } from './dto/response/user-inventory-admin.response.dto';
import { ItemGrantAdminResponseDto } from './dto/response/item-grant-admin.response.dto';


// Domain
import { UserInventory } from '../../domain/user-inventory.entity';
import { UserInventoryDto } from '../../ports/user-inventory.repository.port';

@Controller('admin/gamification/inventory')
@ApiTags('Admin Gamification Inventory Management')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class InventoryAdminController {
  constructor(
    private readonly grantItemService: GrantItemAdminService,
    private readonly findInventoryService: FindUserInventoryAdminService,
    private readonly revokeItemService: RevokeInventoryItemAdminService,
  ) { }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get User Inventory / 유저 인벤토리 조회',
    description: 'Retrieves all inventory items for a specific user. / 특정 유저의 전체 인벤토리 목록을 조회합니다.',
  })
  @ApiParam({ name: 'userId', description: 'User ID (BigInt as string)', example: '1' })
  @ApiQuery({ name: 'lang', enum: Language, required: false, description: 'Display Language / 표시 언어' })
  @ApiStandardResponse(UserInventoryAdminResponseDto, { isArray: true })
  async getUserInventory(
    @Param('userId') userId: string,
    @Query('lang') lang?: Language,
  ): Promise<UserInventoryAdminResponseDto[]> {
    const list = await this.findInventoryService.execute({
      userId: BigInt(userId),
    });

    return list.map((i) => this.mapDtoToResponse(i, lang));
  }


  @Post('grant')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'GAMIFICATION',
    action: 'GRANT_ITEM',
    extractMetadata: (req) => ({
      payload: req.body,
    }),
  })
  @ApiOperation({
    summary: 'Grant Item to User / 유저에게 아이템 지급',
    description: 'Administratively grants an item to a user. / 관리자 권한으로 유저에게 아이템을 수동 지급합니다.',
  })
  @ApiStandardResponse(ItemGrantAdminResponseDto)
  async grantItem(
    @Body() dto: GrantItemAdminRequestDto,
  ): Promise<ItemGrantAdminResponseDto> {
    await this.grantItemService.execute({
      userId: BigInt(dto.userId),
      itemId: BigInt(dto.itemId),
      quantity: dto.quantity,
    });

    return {
      isSuccess: true,
    };
  }



  @Delete(':id')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'GAMIFICATION',
    action: 'REVOKE_ITEM',
    extractMetadata: (req) => ({
      inventoryId: req.params.id,
    }),
  })
  @ApiOperation({
    summary: 'Revoke Inventory Item / 인벤토리 아이템 회수',
    description: 'Administratively expires or removes an item from a users inventory. / 관리자 권한으로 유저의 아이템을 회수(만료) 처리합니다.',
  })
  @ApiParam({ name: 'id', description: 'Inventory Entry ID (BigInt as string)', example: '1' })
  async revokeItem(
    @Param('id') id: string,
  ): Promise<void> {
    await this.revokeItemService.execute({
      inventoryId: BigInt(id),
    });
  }

  /**
   * Repository DTO -> Response DTO 매핑 (효과 정보 포함 가능)
   */
  private mapDtoToResponse(d: UserInventoryDto, lang?: Language): UserInventoryAdminResponseDto {
    const translation = d.translations.find((t) => t.language === lang) || d.translations[0];

    return {
      id: d.id.toString(),
      userId: d.userId.toString(),
      itemId: d.itemId.toString(),
      itemCode: d.itemCode,
      itemType: d.itemType,
      name: translation?.name ?? 'Unknown',
      description: translation?.description ?? null,
      quantity: d.quantity,
      status: d.status,
      slot: d.slot as any,
      effects: d.effects as any,
      activatedAt: null,
      expiresAt: null,
      createdAt: new Date(), // 실제 엔티티 시점이 필요한 경우 Repo DTO 보강 필요
      updatedAt: new Date(),
    };
  }
}

