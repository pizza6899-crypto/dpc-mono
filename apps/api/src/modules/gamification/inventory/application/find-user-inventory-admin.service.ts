import { Inject, Injectable } from '@nestjs/common';
import { InventoryStatus, ItemType, Language } from '@prisma/client';
import { USER_INVENTORY_REPOSITORY_PORT } from '../ports/user-inventory.repository.port';
import type { UserInventoryRepositoryPort, UserInventoryDto } from '../ports/user-inventory.repository.port';
import { UserInventoryAdminResponseDto } from '../controllers/admin/dto/response/user-inventory-admin.response.dto';

export interface FindUserInventoryAdminParams {
  userId: bigint;
  status?: InventoryStatus;
  itemType?: ItemType;
  lang?: Language;
}

/**
 * 관리자가 특정 유저의 인벤토리 현황을 조회하는 서비스
 */
@Injectable()
export class FindUserInventoryAdminService {
  constructor(
    @Inject(USER_INVENTORY_REPOSITORY_PORT)
    private readonly inventoryRepo: UserInventoryRepositoryPort,
  ) { }

  /**
   * 유저별 인벤토리 목록 조회 (다국어 처리 포함)
   */
  async execute(params: FindUserInventoryAdminParams): Promise<UserInventoryAdminResponseDto[]> {
    const list = await this.inventoryRepo.findByUserId(params.userId, {
      status: params.status,
      itemType: params.itemType,
    });

    return list.map((i) => this.mapDtoToResponse(i, params.lang));
  }

  /**
   * 단일 인벤토리 아이템 조회
   */
  async findById(id: bigint, lang?: Language): Promise<UserInventoryAdminResponseDto | null> {
    const d = await this.inventoryRepo.findDtoById(id);
    return d ? this.mapDtoToResponse(d, lang) : null;
  }

  /**
   * 내부 매퍼: Repository DTO -> Response DTO (언어 치환 처리)
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
      activatedAt: d.activatedAt,
      expiresAt: d.expiresAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
}
