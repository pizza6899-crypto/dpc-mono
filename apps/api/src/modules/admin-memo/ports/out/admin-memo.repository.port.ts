// src/modules/admin-memo/ports/out/admin-memo.repository.port.ts
import { AdminMemo } from '../../domain';

export interface CreateAdminMemoParams {
    adminId: bigint;
    content: string;
    depositId?: bigint;
}

export interface AdminMemoRepositoryPort {
    create(params: CreateAdminMemoParams): Promise<AdminMemo>;
    findByDepositId(depositId: bigint, limit?: number): Promise<AdminMemo[]>;
}

export const ADMIN_MEMO_REPOSITORY = Symbol('ADMIN_MEMO_REPOSITORY');
