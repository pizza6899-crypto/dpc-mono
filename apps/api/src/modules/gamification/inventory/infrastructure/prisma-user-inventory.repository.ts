import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { InventoryStatus, ItemSlot } from '@prisma/client';
import { UserInventoryDto, UserInventoryRepositoryPort } from '../ports/user-inventory.repository.port';
import { UserInventory } from '../domain/user-inventory.entity';
import { UserInventoryMapper } from './user-inventory.mapper';
import { ItemEffect } from '../../catalog/domain/item-catalog.entity';

@Injectable()
export class PrismaUserInventoryRepository implements UserInventoryRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: UserInventoryMapper,
  ) { }

  async findById(id: bigint): Promise<UserInventory | null> {
    const record = await this.tx.userInventory.findUnique({
      where: { id },
    });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findDtoById(id: bigint): Promise<UserInventoryDto | null> {
    const item = await this.tx.userInventory.findUnique({
      where: { id },
      include: {
        catalog: {
          include: {
            translations: true,
          },
        },
      },
    });

    if (!item) return null;

    return {
      id: item.id,
      userId: item.userId,
      itemId: item.itemId,
      quantity: item.quantity,
      status: item.status,
      slot: item.slot,
      effects: item.catalog.effects as unknown as ItemEffect[],
      translations: (item.catalog as any).translations,
      itemType: item.catalog.type,
      itemCode: item.catalog.code,
      activatedAt: item.activatedAt,
      expiresAt: item.expiresAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }



  async findByUserId(userId: bigint): Promise<UserInventoryDto[]> {
    const list = await this.tx.userInventory.findMany({
      where: { userId },
      include: {
        catalog: {
          include: {
            translations: true,
          },
        },
      },
    });

    return list.map(item => ({
      id: item.id,
      userId: item.userId,
      itemId: item.itemId,
      quantity: item.quantity,
      status: item.status,
      slot: item.slot,
      effects: item.catalog.effects as unknown as ItemEffect[],
      translations: (item.catalog as any).translations,
      itemType: item.catalog.type,
      itemCode: item.catalog.code,
      activatedAt: item.activatedAt,
      expiresAt: item.expiresAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));




  }

  async findByUserIdAndStatus(userId: bigint, status: InventoryStatus): Promise<UserInventoryDto[]> {
    const list = await this.tx.userInventory.findMany({
      where: {
        userId,
        status,
      },
      include: {
        catalog: {
          include: {
            translations: true,
          },
        },
      },
    });

    return list.map(item => ({
      id: item.id,
      userId: item.userId,
      itemId: item.itemId,
      quantity: item.quantity,
      status: item.status,
      slot: item.slot,
      effects: item.catalog.effects as unknown as ItemEffect[],
      translations: (item.catalog as any).translations,
      itemType: item.catalog.type,
      itemCode: item.catalog.code,
      activatedAt: item.activatedAt,
      expiresAt: item.expiresAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  async findByUserIdAndSlot(userId: bigint, slot: ItemSlot): Promise<UserInventory | null> {
    const record = await this.tx.userInventory.findFirst({
      where: {
        userId,
        slot,
        status: InventoryStatus.ACTIVE, // 장착된 상태여야 함
      },
    });

    return record ? this.mapper.toDomain(record) : null;
  }

  async findActiveBonuses(userId: bigint): Promise<UserInventoryDto[]> {
    return this.findByUserIdAndStatus(userId, InventoryStatus.ACTIVE);
  }

  async save(inventory: UserInventory): Promise<UserInventory> {
    const data = this.mapper.toPersistence(inventory);

    // ID가 0이면 새로 생성 (DB가 ID 발급)
    if (inventory.id === 0n) {
      const created = await this.tx.userInventory.create({
        data: data as any,
      });
      return this.mapper.toDomain(created);
    }

    // ID가 존재하면 수정
    const updated = await this.tx.userInventory.update({
      where: { id: inventory.id },
      data: data as any,
    });
    return this.mapper.toDomain(updated);
  }
}
