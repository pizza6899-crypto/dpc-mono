// src/modules/deposit/application/admin-crypto-config.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma } from '@repo/database';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { generateUid } from 'src/utils/id.util';
import { CryptoConfigNotFoundException } from '../domain';
import {
  GetCryptoConfigsQueryDto,
  CreateCryptoConfigRequestDto,
  UpdateCryptoConfigRequestDto,
  CryptoConfigResponseDto
} from '../dtos/crypto-config-admin.dto';

@Injectable()
export class AdminCryptoConfigService {
  private readonly logger = new Logger(AdminCryptoConfigService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
  ) { }

  /**
   * 암호화폐 설정 목록 조회
   */
  async getCryptoConfigs(
    query: GetCryptoConfigsQueryDto,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<CryptoConfigResponseDto>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      symbol,
      network,
      isActive,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CryptoConfigWhereInput = {
      ...(symbol && { symbol }),
      ...(network && { network }),
      ...(isActive !== undefined && { isActive }),
    };

    const orderBy: Prisma.CryptoConfigOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [configs, total] = await Promise.all([
      this.tx.cryptoConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.tx.cryptoConfig.count({ where }),
    ]);

    return {
      data: configs.map((config) => ({
        id: config.id.toString(),
        uid: config.uid,
        symbol: config.symbol,
        network: config.network,
        isActive: config.isActive,
        minDepositAmount: config.minDepositAmount.toString(),
        depositFeeRate: config.depositFeeRate.toString(),
        confirmations: config.confirmations,
        contractAddress: config.contractAddress,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      })),
      page,
      limit,
      total,
    };
  }

  /**
   * 암호화폐 설정 등록
   */
  async createCryptoConfig(
    dto: CreateCryptoConfigRequestDto,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<CryptoConfigResponseDto> {
    const config = await this.tx.cryptoConfig.create({
      data: {
        uid: generateUid(),
        symbol: dto.symbol,
        network: dto.network,
        isActive: dto.isActive ?? true,
        minDepositAmount: new Prisma.Decimal(dto.minDepositAmount),
        depositFeeRate: new Prisma.Decimal(dto.depositFeeRate),
        confirmations: dto.confirmations,
        contractAddress: dto.contractAddress || null,
      },
    });

    return {
      id: config.id.toString(),
      uid: config.uid,
      symbol: config.symbol,
      network: config.network,
      isActive: config.isActive,
      minDepositAmount: config.minDepositAmount.toString(),
      depositFeeRate: config.depositFeeRate.toString(),
      confirmations: config.confirmations,
      contractAddress: config.contractAddress,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * 암호화폐 설정 상세 조회
   */
  async getCryptoConfigDetail(
    id: bigint,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<CryptoConfigResponseDto> {
    const config = await this.tx.cryptoConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new CryptoConfigNotFoundException(id);
    }

    return {
      id: config.id.toString(),
      uid: config.uid,
      symbol: config.symbol,
      network: config.network,
      isActive: config.isActive,
      minDepositAmount: config.minDepositAmount.toString(),
      depositFeeRate: config.depositFeeRate.toString(),
      confirmations: config.confirmations,
      contractAddress: config.contractAddress,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * 암호화폐 설정 수정
   */
  async updateCryptoConfig(
    id: bigint,
    dto: UpdateCryptoConfigRequestDto,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<CryptoConfigResponseDto> {
    const existing = await this.tx.cryptoConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new CryptoConfigNotFoundException(id);
    }

    const updateData: Prisma.CryptoConfigUpdateInput = {};
    if (dto.symbol !== undefined) updateData.symbol = dto.symbol;
    if (dto.network !== undefined) updateData.network = dto.network;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.minDepositAmount !== undefined)
      updateData.minDepositAmount = new Prisma.Decimal(dto.minDepositAmount);
    if (dto.depositFeeRate !== undefined)
      updateData.depositFeeRate = new Prisma.Decimal(dto.depositFeeRate);
    if (dto.confirmations !== undefined)
      updateData.confirmations = dto.confirmations;
    if (dto.contractAddress !== undefined)
      updateData.contractAddress = dto.contractAddress;

    const updated = await this.tx.cryptoConfig.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updated.id.toString(),
      uid: updated.uid,
      symbol: updated.symbol,
      network: updated.network,
      isActive: updated.isActive,
      minDepositAmount: updated.minDepositAmount.toString(),
      depositFeeRate: updated.depositFeeRate.toString(),
      confirmations: updated.confirmations,
      contractAddress: updated.contractAddress,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * 암호화폐 설정 삭제 (소프트 삭제)
   */
  async deleteCryptoConfig(
    id: bigint,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<{ success: boolean }> {
    const existing = await this.tx.cryptoConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new CryptoConfigNotFoundException(id);
    }

    await this.tx.cryptoConfig.delete({
      where: { id },
    });

    return { success: true };
  }
}

