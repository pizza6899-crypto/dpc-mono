// src/modules/deposit/application/admin-bank-config.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { Prisma } from '@repo/database';
import { ExchangeCurrencyCode } from '@repo/database';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { generateUid } from 'src/utils/id.util';
import { BankConfigNotFoundException } from '../domain';
import {
  GetBankConfigsQueryDto,
  CreateBankConfigRequestDto,
  UpdateBankConfigRequestDto,
  BankConfigResponseDto
} from '../dtos/bank-config-admin.dto';

@Injectable()
export class AdminBankConfigService {
  private readonly logger = new Logger(AdminBankConfigService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  /**
   * 은행 계좌 목록 조회
   */
  async getBankConfigs(
    query: GetBankConfigsQueryDto,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<BankConfigResponseDto>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      currency,
      isActive,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.BankConfigWhereInput = {
      deletedAt: null,
      ...(currency && { currency }),
      ...(isActive !== undefined && { isActive }),
    };

    const orderBy: Prisma.BankConfigOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [configs, total] = await Promise.all([
      this.tx.bankConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.tx.bankConfig.count({ where }),
    ]);

    return {
      data: configs.map((config) => ({
        id: config.id.toString(),
        uid: config.uid,
        currency: config.currency,
        bankName: config.bankName,
        accountNumber: config.accountNumber,
        accountHolder: config.accountHolder,
        isActive: config.isActive,
        priority: config.priority,
        description: config.description,
        notes: config.notes,
        minAmount: config.minAmount.toString(),
        maxAmount: config.maxAmount?.toString(),
        totalDeposits: config.totalDeposits,
        totalDepositAmount: config.totalDepositAmount.toString(),
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      })),
      page,
      limit,
      total,
    };
  }

  /**
   * 은행 계좌 등록
   */
  async createBankConfig(
    dto: CreateBankConfigRequestDto,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<BankConfigResponseDto> {
    const bankConfig = await this.tx.bankConfig.create({
      data: {
        uid: generateUid(),
        currency: dto.currency,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountHolder: dto.accountHolder,
        isActive: dto.isActive ?? true,
        priority: dto.priority ?? 0,
        description: dto.description,
        notes: dto.notes,
        minAmount: new Prisma.Decimal(dto.minAmount),
        maxAmount: dto.maxAmount ? new Prisma.Decimal(dto.maxAmount) : null,
      },
    });

    return {
      id: bankConfig.id.toString(),
      uid: bankConfig.uid,
      currency: bankConfig.currency,
      bankName: bankConfig.bankName,
      accountNumber: bankConfig.accountNumber,
      accountHolder: bankConfig.accountHolder,
      isActive: bankConfig.isActive,
      priority: bankConfig.priority,
      description: bankConfig.description,
      notes: bankConfig.notes,
      minAmount: bankConfig.minAmount.toString(),
      maxAmount: bankConfig.maxAmount?.toString() ?? null,
      totalDeposits: 0,
      totalDepositAmount: '0',
      createdAt: bankConfig.createdAt,
      updatedAt: bankConfig.updatedAt,
    };
  }

  /**
   * 은행 계좌 상세 조회
   */
  async getBankConfigDetail(
    id: bigint,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<BankConfigResponseDto> {
    const config = await this.tx.bankConfig.findUnique({
      where: { id },
    });

    if (!config || config.deletedAt) {
      throw new BankConfigNotFoundException(id);
    }

    return {
      id: config.id.toString(),
      uid: config.uid,
      currency: config.currency,
      bankName: config.bankName,
      accountNumber: config.accountNumber,
      accountHolder: config.accountHolder,
      isActive: config.isActive,
      priority: config.priority,
      description: config.description,
      notes: config.notes,
      minAmount: config.minAmount.toString(),
      maxAmount: config.maxAmount?.toString(),
      totalDeposits: config.totalDeposits,
      totalDepositAmount: config.totalDepositAmount.toString(),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * 은행 계좌 수정
   */
  async updateBankConfig(
    id: bigint,
    dto: UpdateBankConfigRequestDto,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<BankConfigResponseDto> {
    const existing = await this.tx.bankConfig.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      throw new BankConfigNotFoundException(id);
    }

    const updateData: Prisma.BankConfigUpdateInput = {};
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.bankName !== undefined) updateData.bankName = dto.bankName;
    if (dto.accountNumber !== undefined)
      updateData.accountNumber = dto.accountNumber;
    if (dto.accountHolder !== undefined)
      updateData.accountHolder = dto.accountHolder;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.minAmount !== undefined)
      updateData.minAmount = new Prisma.Decimal(dto.minAmount);
    if (dto.maxAmount !== undefined)
      updateData.maxAmount = dto.maxAmount
        ? new Prisma.Decimal(dto.maxAmount)
        : null;

    const updated = await this.tx.bankConfig.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updated.id.toString(),
      uid: updated.uid,
      currency: updated.currency,
      bankName: updated.bankName,
      accountNumber: updated.accountNumber,
      accountHolder: updated.accountHolder,
      isActive: updated.isActive,
      priority: updated.priority,
      description: updated.description,
      notes: updated.notes,
      minAmount: updated.minAmount.toString(),
      maxAmount: updated.maxAmount?.toString() ?? null,
      totalDeposits: updated.totalDeposits,
      totalDepositAmount: updated.totalDepositAmount.toString(),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * 은행 계좌 삭제 (소프트 삭제)
   */
  async deleteBankConfig(
    id: bigint,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<{ success: boolean }> {
    const existing = await this.tx.bankConfig.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      throw new BankConfigNotFoundException(id);
    }

    await this.tx.bankConfig.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { success: true };
  }
}

