import { AdminMemo, AdminMemoTarget, AdminMemoTargetType } from '../../domain';

export interface CreateAdminMemoParams {
    adminId: bigint;
    content: string;
    target: AdminMemoTarget;
}

export interface AdminMemoRepositoryPort {
    create(params: CreateAdminMemoParams): Promise<AdminMemo>;
    findByTarget(type: AdminMemoTargetType, targetId: bigint, limit?: number): Promise<AdminMemo[]>;
}

export const ADMIN_MEMO_REPOSITORY = Symbol('ADMIN_MEMO_REPOSITORY');
