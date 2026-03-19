import { Inject, Injectable } from '@nestjs/common';
import {
  SUPPORT_INQUIRY_SUMMARY_REPOSITORY_PORT,
  type SupportInquirySummaryRepositoryPort,
} from '../ports/support-inquiry-summary.repository.port';
import { SupportInquirySummary } from '../domain/support-inquiry-summary';
import {
  SupportStatus,
  SupportPriority,
  SupportCategory,
} from '@prisma/client';

export interface ListSupportInquiriesParams {
  status?: SupportStatus;
  priority?: SupportPriority;
  category?: SupportCategory;
  adminId?: bigint;
  currentAdminId?: bigint;
  roomId?: bigint;
}

@Injectable()
export class ListSupportInquiriesService {
  constructor(
    @Inject(SUPPORT_INQUIRY_SUMMARY_REPOSITORY_PORT)
    private readonly summaryRepository: SupportInquirySummaryRepositoryPort,
  ) {}

  async execute(
    params: ListSupportInquiriesParams,
  ): Promise<SupportInquirySummary[]> {
    return this.summaryRepository.list({
      status: params.status,
      priority: params.priority,
      category: params.category,
      adminId: params.adminId,
      currentAdminId: params.currentAdminId,
      roomId: params.roomId,
    });
  }
}
