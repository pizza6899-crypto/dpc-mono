// src/modules/deposit/application/admin-crypto-config.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Prisma } from '@repo/database';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { generateUid } from 'src/utils/id.util';
import { CryptoConfigNotFoundException } from '../domain';

@Injectable()
export class AdminCryptoConfigService {
  private readonly logger = new Logger(AdminCryptoConfigService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 암호화폐 설정 목록 조회
   */
  async getCryptoConfigs(
    query: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      symbol?: string;
      network?: string;
      isActive?: boolean;
    },
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<any>> {
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
      this.prismaService.cryptoConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prismaService.cryptoConfig.count({ where }),
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
   * 암호화폐 설정 상세 조회
   */
  async getCryptoConfigDetail(
    id: bigint,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<any> {
    const config = await this.prismaService.cryptoConfig.findUnique({
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
    dto: {
      symbol?: string;
      network?: string;
      isActive?: boolean;
      minDepositAmount?: string;
      depositFeeRate?: string;
      confirmations?: number;
      contractAddress?: string | null;
    },
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<any> {
    const existing = await this.prismaService.cryptoConfig.findUnique({
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

    const updated = await this.prismaService.cryptoConfig.update({
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
}

