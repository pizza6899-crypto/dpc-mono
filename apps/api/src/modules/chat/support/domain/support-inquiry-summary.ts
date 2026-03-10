import { type Prisma, SupportStatus, SupportPriority, SupportCategory } from '@prisma/client';

export class SupportInquirySummary {
    constructor(
        public readonly roomId: bigint,
        public readonly status: SupportStatus,
        public readonly priority: SupportPriority,
        public readonly category: SupportCategory,
        public readonly subject: string,
        public readonly isActive: boolean,
        public readonly metadata: Prisma.JsonValue,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly lastMessageAt: Date | null,
        public readonly adminId: bigint | null,
        // User Info
        public readonly userId: bigint,
        public readonly userNickname: string,
        public readonly userLoginId: string,
        public readonly userAvatarUrl: string | null,
        // Summary info
        public readonly lastMessageContent: string | null,
        public readonly unreadCount: number,
    ) { }
}
