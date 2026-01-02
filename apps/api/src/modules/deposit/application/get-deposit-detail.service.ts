// src/modules/deposit/application/get-deposit-detail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import type { RequestClientInfo } from 'src/common/http/types';
import { AdminDepositListItemDto } from '../dtos/admin-deposit-response.dto';
import { DepositNotFoundException } from '../domain';

interface GetDepositDetailParams {
  id: bigint;
  adminId: bigint;
  requestInfo: RequestClientInfo;
}

interface GetDepositDetailResult extends AdminDepositListItemDto {}

@Injectable()
export class GetDepositDetailService {
  private readonly logger = new Logger(GetDepositDetailService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    params: GetDepositDetailParams,
  ): Promise<GetDepositDetailResult> {
    const { id, adminId, requestInfo } = params;

    const deposit = await this.prismaService.depositDetail.findUnique({
      where: { id },
      include: {
        transaction: {
          select: {
            userId: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        BankConfig: true,
        CryptoConfig: true,
      },
    });

    if (!deposit) {
      throw new DepositNotFoundException(id);
    }

    return {
      id: deposit.id.toString(),
      userId: deposit.transaction.userId,
      userEmail: deposit.transaction.user.email || '',
      status: deposit.status,
      methodType: deposit.methodType,
      provider: deposit.provider,
      depositCurrency: deposit.depositCurrency,
      createdAt: deposit.createdAt,
      updatedAt: deposit.updatedAt,
      failureReason: deposit.failureReason || '',
    };
  }
}

