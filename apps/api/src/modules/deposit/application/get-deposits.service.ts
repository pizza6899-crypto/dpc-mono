// src/modules/deposit/application/get-deposits.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { Prisma } from '@repo/database';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { GetDepositsQueryDto } from '../dtos/get-deposits-query.dto';
import { AdminDepositListItemDto } from '../dtos/admin-deposit-response.dto';

interface GetDepositsParams {
  query: GetDepositsQueryDto;
  adminId: bigint;
  requestInfo: RequestClientInfo;
}

interface GetDepositsResult extends PaginatedData<AdminDepositListItemDto> { }

@Injectable()
export class GetDepositsService {
  private readonly logger = new Logger(GetDepositsService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async execute(params: GetDepositsParams): Promise<GetDepositsResult> {
    const { query, adminId, requestInfo } = params;

    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      methodType,
      userId,
      currency,
      startDate,
      endDate,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.DepositDetailWhereInput = {
      ...(status && { status }),
      ...(methodType && { methodType }),
      ...(userId && {
        transaction: {
          userId,
        },
      }),
      ...(currency && { depositCurrency: currency }),
      ...(startDate &&
        endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const orderBy: Prisma.DepositDetailOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [deposits, total] = await Promise.all([
      this.tx.depositDetail.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
        },
      }),
      this.tx.depositDetail.count({ where }),
    ]);

    return {
      data: deposits.map((deposit) => ({
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
      })),
      page,
      limit,
      total,
    };
  }
}

