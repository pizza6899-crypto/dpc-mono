// apps/api/src/modules/deposit/ports/out/deposit-detail.repository.port.ts
import type {
  Prisma,
  ExchangeCurrencyCode,
  DepositDetailStatus,
  DepositMethodType,
} from '@prisma/client';
import type { DepositDetail } from '../../domain';

export interface DepositListQuery {
  skip?: number;
  take?: number;
  status?: DepositDetailStatus;
  methodType?: DepositMethodType;
  userId?: bigint;
  currency?: ExchangeCurrencyCode;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DepositStats {
  todayTotalAmount: Prisma.Decimal;
  pendingCount: number;
  methodDistribution: {
    crypto: number;
    bank: number;
  };
}

export interface DepositWithUser {
  deposit: DepositDetail;
  userEmail: string | null;
}

export interface DepositDetailRepositoryPort {
  findById(id: bigint): Promise<DepositDetail | null>;
  getById(id: bigint): Promise<DepositDetail>;
  update(deposit: DepositDetail): Promise<DepositDetail>;
  create(deposit: DepositDetail): Promise<DepositDetail>;
  // User queries
  listByUserId(
    userId: bigint,
    query: DepositListQuery,
  ): Promise<{ items: DepositDetail[]; total: number }>;
  findByIdAndUserId(id: bigint, userId: bigint): Promise<DepositDetail | null>;
  existsPendingByUserId(userId: bigint): Promise<boolean>;

  // Admin queries
  list(
    query: DepositListQuery,
  ): Promise<{ items: DepositWithUser[]; total: number }>;
  getByIdWithUser(id: bigint): Promise<DepositWithUser>;
  getStats(): Promise<DepositStats>;
}
