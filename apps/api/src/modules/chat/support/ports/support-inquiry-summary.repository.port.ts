import { SupportStatus, SupportPriority, SupportCategory } from '@prisma/client';
import { SupportInquirySummary } from '../domain/support-inquiry-summary';

export const SUPPORT_INQUIRY_SUMMARY_REPOSITORY_PORT = Symbol('SUPPORT_INQUIRY_SUMMARY_REPOSITORY_PORT');

export interface SupportInquirySummaryRepositoryPort {
    list(filters: {
        status?: SupportStatus;
        priority?: SupportPriority;
        category?: SupportCategory;
        adminId?: bigint;
        currentAdminId?: bigint;
        roomId?: bigint;
    }): Promise<SupportInquirySummary[]>;
}
