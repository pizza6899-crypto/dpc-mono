// apps/api/src/modules/notification/inbox/domain/model/notification-log.entity.ts

import type { ChannelType, Language } from '@prisma/client';
import { NotifyStatus } from '@prisma/client';
import {
  NotificationAlreadyReadException,
  NotificationAlreadyDeletedException,
} from '../inbox.exception';
import { type NotificationEventType } from '../../../common';

interface CreateNotificationLogParams {
  id: bigint;
  createdAt: Date;
  alertId: bigint;
  alertCreatedAt: Date;
  templateId?: bigint | null;
  templateEvent?: NotificationEventType | null;
  locale?: Language | null;
  channel: ChannelType;
  receiverId: bigint;
  target?: string | null;
  title?: string | null;
  body?: string | null;
  actionUri?: string | null;
  priority?: number;
  scheduledAt?: Date;
  metadata?: Record<string, unknown> | null;
}

interface FromPersistenceParams {
  id: bigint;
  alertId: bigint;
  alertCreatedAt: Date;
  templateId: bigint | null;
  templateEvent: NotificationEventType | null;
  locale: Language | null;
  channel: ChannelType;
  receiverId: bigint;
  target: string | null;
  title: string | null;
  body: string | null;
  actionUri: string | null;
  isRead: boolean;
  readAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  priority: number;
  scheduledAt: Date;
  status: NotifyStatus;
  errorMessage: string | null;
  sentAt: Date | null;
  retryCount: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * NotificationLog 도메인 엔티티
 *
 * 유저에게 발송된 알림 이력을 표현합니다.
 * - 채널별 실제 발송 상태 추적
 * - 읽음/삭제 상태 관리
 * - 템플릿 렌더링 결과 스냅샷
 */
export class NotificationLog {
  private constructor(
    public readonly id: bigint | null,
    public readonly alertId: bigint,
    public readonly alertCreatedAt: Date,
    public readonly templateId: bigint | null,
    public readonly templateEvent: NotificationEventType | null,
    public readonly locale: Language | null,
    public readonly channel: ChannelType,
    public readonly receiverId: bigint,
    public readonly target: string | null,
    private _title: string | null,
    private _body: string | null,
    private _actionUri: string | null,
    private _isRead: boolean,
    private _readAt: Date | null,
    private _isDeleted: boolean,
    private _deletedAt: Date | null,
    public readonly priority: number,
    public readonly scheduledAt: Date,
    private _status: NotifyStatus,
    private _errorMessage: string | null,
    private _sentAt: Date | null,
    private _retryCount: number,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) { }

  static create(params: CreateNotificationLogParams): NotificationLog {
    return new NotificationLog(
      params.id,
      params.alertId,
      params.alertCreatedAt,
      params.templateId ?? null,
      params.templateEvent ?? null,
      params.locale ?? null,
      params.channel,
      params.receiverId,
      params.target ?? null,
      params.title ?? null,
      params.body ?? null,
      params.actionUri ?? null,
      false,
      null,
      false,
      null,
      params.priority ?? 5,
      params.scheduledAt ?? new Date(),
      NotifyStatus.PENDING,
      null,
      null,
      0,
      params.metadata ?? null,
      params.createdAt,
      params.createdAt,
    );
  }

  static fromPersistence(data: FromPersistenceParams): NotificationLog {
    return new NotificationLog(
      data.id,
      data.alertId,
      data.alertCreatedAt,
      data.templateId,
      data.templateEvent,
      data.locale,
      data.channel,
      data.receiverId,
      data.target,
      data.title,
      data.body,
      data.actionUri,
      data.isRead,
      data.readAt,
      data.isDeleted,
      data.deletedAt,
      data.priority,
      data.scheduledAt,
      data.status,
      data.errorMessage,
      data.sentAt,
      data.retryCount,
      data.metadata,
      data.createdAt,
      data.updatedAt,
    );
  }

  // Getters
  get isRead(): boolean {
    return this._isRead;
  }

  get readAt(): Date | null {
    return this._readAt;
  }

  get title(): string | null {
    return this._title;
  }

  get body(): string | null {
    return this._body;
  }

  get actionUri(): string | null {
    return this._actionUri;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  get status(): NotifyStatus {
    return this._status;
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  get sentAt(): Date | null {
    return this._sentAt;
  }

  get retryCount(): number {
    return this._retryCount;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // 읽음/삭제 상태 변경
  markAsRead(): void {
    if (this._isRead) {
      throw new NotificationAlreadyReadException(this.id!);
    }
    this._isRead = true;
    this._readAt = new Date();
    this._updatedAt = new Date();
  }

  updateContent(title: string, body: string, actionUri: string | null = null): void {
    this._title = title;
    this._body = body;
    this._actionUri = actionUri;
    this._updatedAt = new Date();
  }

  markAsDeleted(): void {
    if (this._isDeleted) {
      throw new NotificationAlreadyDeletedException(this.id!);
    }
    this._isDeleted = true;
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  // 발송 상태 변경
  markAsSending(): void {
    this._status = NotifyStatus.SENDING;
    this._updatedAt = new Date();
  }

  markAsSuccess(): void {
    this._status = NotifyStatus.SUCCESS;
    this._sentAt = new Date();
    this._updatedAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this._status = NotifyStatus.FAILED;
    this._errorMessage = errorMessage;
    this._updatedAt = new Date();
  }

  markAsCanceled(): void {
    this._status = NotifyStatus.CANCELED;
    this._updatedAt = new Date();
  }

  incrementRetry(): void {
    this._retryCount += 1;
    this._updatedAt = new Date();
  }

  canRetry(maxRetryCount: number): boolean {
    return this._retryCount < maxRetryCount;
  }

  belongsTo(userId: bigint): boolean {
    return this.receiverId === userId;
  }
}
