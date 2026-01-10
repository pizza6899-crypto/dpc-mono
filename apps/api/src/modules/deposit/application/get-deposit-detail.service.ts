// src/modules/deposit/application/get-deposit-detail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type { RequestClientInfo } from 'src/common/http/types';
import { AdminDepositListItemDto } from '../dtos/admin-deposit-response.dto';
import { DepositNotFoundException } from '../domain';

interface GetDepositDetailParams {
  id: bigint;
  adminId: bigint;
  requestInfo: RequestClientInfo;
}

interface GetDepositDetailResult extends AdminDepositListItemDto { }

@Injectable()
export class GetDepositDetailService {
  private readonly logger = new Logger(GetDepositDetailService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async execute(
    params: GetDepositDetailParams,
  ): Promise<GetDepositDetailResult> {
    const { id, adminId, requestInfo } = params;

    const deposit = await this.tx.depositDetail.findUnique({
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
        bankDepositConfig: true,
        cryptoDepositConfig: true,
      },
    });

    if (!deposit) {
      throw new DepositNotFoundException(id);
    }

    return {
      id: deposit.id.toString(),
      userId: deposit.userId,
      userEmail: deposit.transaction?.user?.email || '',
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

