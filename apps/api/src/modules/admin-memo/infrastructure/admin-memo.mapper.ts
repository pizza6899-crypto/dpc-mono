import { Injectable } from '@nestjs/common';
import { Prisma, AdminMemo as PrismaAdminMemo } from '@prisma/client';
import { AdminMemo, AdminMemoTargetType } from '../domain';

@Injectable()
export class AdminMemoMapper {
  /**
   * Prisma 모델 -> Domain 엔티티 변환
   */
  toDomain(
    prismaModel: PrismaAdminMemo & { admin?: { nickname: string } },
  ): AdminMemo {
    let targetType: AdminMemoTargetType = 'USER';
    let targetId: bigint = 0n;

    if (prismaModel.depositId) {
      targetType = 'DEPOSIT';
      targetId = prismaModel.depositId;
    } else if (prismaModel.userId) {
      targetType = 'USER';
      targetId = prismaModel.userId;
    }

    return AdminMemo.fromPersistence({
      id: prismaModel.id,
      adminId: prismaModel.adminId,
      content: prismaModel.content,
      createdAt: prismaModel.createdAt,
      target: { type: targetType, id: targetId },
      adminNickname: prismaModel.admin?.nickname,
    });
  }

  /**
   * Domain 엔티티 -> Prisma 생성 데이터 변환
   */
  toPrismaCreate(domain: AdminMemo): Prisma.AdminMemoCreateInput {
    const createInput: Prisma.AdminMemoCreateInput = {
      admin: { connect: { id: domain.adminId } },
      content: domain.content,
      createdAt: domain.createdAt,
    };

    if (domain.target.type === 'DEPOSIT') {
      createInput.deposit = { connect: { id: domain.target.id } };
    } else if (domain.target.type === 'USER') {
      createInput.user = { connect: { id: domain.target.id } };
    }

    return createInput;
  }
}
