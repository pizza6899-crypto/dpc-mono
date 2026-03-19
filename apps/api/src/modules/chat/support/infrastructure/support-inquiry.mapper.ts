import { SupportInquirySummary } from '../domain/support-inquiry-summary';
import { Cast } from '../../../../infrastructure/persistence/persistence.util';

export class SupportInquiryMapper {
  public static toSummary(data: any): SupportInquirySummary {
    const lastMessage = data.messages?.[0];
    const userMember = data.members?.find(
      (m: any) => m.role === 'MEMBER',
    )?.user;

    return new SupportInquirySummary(
      Cast.bigint(data.id),
      data.supportStatus!,
      data.supportPriority!,
      data.supportCategory!,
      data.supportSubject!,
      data.isActive,
      data.metadata,
      Cast.date(data.createdAt),
      Cast.date(data.updatedAt),
      data.lastMessageAt ? Cast.date(data.lastMessageAt) : null,
      data.supportAdminId ? Cast.bigint(data.supportAdminId) : null,
      userMember ? Cast.bigint(userMember.id) : 0n,
      userMember?.nickname || '',
      userMember?.loginId || '',
      userMember?.avatarUrl || null,
      lastMessage?.content || null,
      data.unreadCount ?? 0,
    );
  }
}
