import { Injectable } from '@nestjs/common';
import { Prisma, AdminMemo as PrismaAdminMemo } from '@prisma/client';
import { AdminMemo } from '../domain';

@Injectable()
export class AdminMemoMapper {
    /**
     * Prisma 모델 -> Domain 엔티티 변환
     */
    toDomain(prismaModel: PrismaAdminMemo & { admin?: { nickname: string } }): AdminMemo {
        return AdminMemo.fromPersistence({
            id: prismaModel.id,
            adminId: prismaModel.adminId,
            content: prismaModel.content,
            createdAt: prismaModel.createdAt,
            depositId: prismaModel.depositId,
            adminNickname: prismaModel.admin?.nickname,
        });
    }

    /**
     * Domain 엔티티 -> Prisma 생성 데이터 변환
     */
    toPrismaCreate(domain: AdminMemo): Prisma.AdminMemoCreateInput {
        return {
            admin: { connect: { id: domain.adminId } },
            content: domain.content,
            deposit: domain.depositId
                ? { connect: { id: domain.depositId } }
                : undefined,
            createdAt: domain.createdAt,
        };
    }
}
