// apps/api/src/modules/notification/inbox/ports/notification-log.repository.port.ts

import type { ChannelType } from '@prisma/client';
import { NotifyStatus } from '@prisma/client';
import type { NotificationLog } from '../domain';

export interface NotificationLogListQuery {
  receiverId: bigint;
  channel?: ChannelType;
  isRead?: boolean;
  cursor?: bigint;
  limit?: number;
}

export interface NotificationLogRepositoryPort {
  /**
   * NotificationLog 생성
   */
  create(log: NotificationLog): Promise<NotificationLog>;

  /**
   * 다건 생성 (팬아웃)
   */
  createMany(logs: NotificationLog[]): Promise<void>;

  /**
   * 복합키로 조회 (nullable)
   */
  findById(createdAt: Date, id: bigint): Promise<NotificationLog | null>;

  /**
   * 복합키로 조회 (예외 발생)
   */
  getById(createdAt: Date, id: bigint): Promise<NotificationLog>;

  /**
   * 유저 + ID로 조회 (권한 체크용)
   */
  findByIdAndReceiverId(
    createdAt: Date,
    id: bigint,
    receiverId: bigint,
  ): Promise<NotificationLog | null>;

  /**
   * NotificationLog 업데이트
   */
  update(log: NotificationLog): Promise<NotificationLog>;

  /**
   * 유저 알림함 조회 (커서 기반 페이지네이션)
   */
  listByReceiverId(query: NotificationLogListQuery): Promise<NotificationLog[]>;

  /**
   * 안 읽은 알림 개수
   */
  countUnread(receiverId: bigint, channel: ChannelType): Promise<number>;

  /**
   * 전체 읽음 처리
   */
  markAllAsRead(receiverId: bigint, channel: ChannelType): Promise<number>;

  /**
   * 발송 대기 알림 조회 (Worker용)
   */
  listPendingForSend(limit: number): Promise<NotificationLog[]>;
}
