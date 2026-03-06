import { Injectable } from '@nestjs/common';
import { AdminMemo as PrismaAdminMemo } from '@prisma/client';
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
    toPrismaCreate(domain: AdminMemo): any {
        return {
            adminId: domain.adminId,
            content: domain.content,
            depositId: domain.depositId,
            createdAt: domain.createdAt,
        };
    }
}
