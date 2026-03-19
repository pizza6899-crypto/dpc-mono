import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  SupportStatus,
  SupportPriority,
  SupportCategory,
} from '@prisma/client';
import { SupportInquirySummary } from '../domain/support-inquiry-summary';
import { type SupportInquirySummaryRepositoryPort } from '../ports/support-inquiry-summary.repository.port';
import { SupportInquiryMapper } from './support-inquiry.mapper';

@Injectable()
export class SupportInquirySummaryRepository implements SupportInquirySummaryRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) {}

  async list(filters: {
    status?: SupportStatus;
    priority?: SupportPriority;
    category?: SupportCategory;
    adminId?: bigint;
    currentAdminId?: bigint;
    roomId?: bigint;
  }): Promise<SupportInquirySummary[]> {
    const records = await this.tx.chatRoom.findMany({
      where: {
        type: 'SUPPORT',
        supportStatus: filters.status,
        supportPriority: filters.priority,
        supportCategory: filters.category,
        supportAdminId: filters.adminId,
        id: filters.roomId,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        messages: {
          where: { isDeleted: false },
          orderBy: {
            id: 'desc',
          },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const summaries = await Promise.all(
      records.map(async (record) => {
        // 해당 상담방의 유저(관리자가 아닌 멤버) 찾기
        const userMember = record.members.find((m) => m.role === 'MEMBER');

        // 관리자 공용 읽음 포인터 이후에 유저가 보낸 메시지 수 계산
        const unreadCount = await this.tx.chatMessage.count({
          where: {
            roomId: record.id,
            id: { gt: record.supportAdminLastReadId ?? 0n },
            senderId: userMember
              ? userMember.userId
              : { not: record.supportAdminId ?? -1n },
            isDeleted: false,
          },
        });

        return SupportInquiryMapper.toSummary({
          ...record,
          unreadCount,
        });
      }),
    );

    return summaries;
  }
}
