// apps/api/src/modules/notification/alert/domain/model/alert.entity.ts

import type { ChannelType } from '@prisma/client';
import { AlertStatus } from '@prisma/client';
import { InvalidAlertStatusTransitionException } from '../alert.exception';
import { NotificationPayloadMap } from '../../../common';

export type AlertEvent = keyof NotificationPayloadMap;
export type AlertPayload<E extends AlertEvent> = NotificationPayloadMap[E];

interface CreateAlertParams<E extends AlertEvent> {
  id: bigint;
  createdAt: Date;
  event: E;
  userId?: bigint | null;
  targetGroup?: string | null;
  payload: AlertPayload<E>;
  idempotencyKey?: string | null;
  channels: ChannelType[];
}

interface FromPersistenceParams<E extends AlertEvent> {
  id: bigint;
  event: E;
  userId: bigint | null;
  targetGroup: string | null;
  payload: AlertPayload<E>;
  idempotencyKey: string | null;
  status: AlertStatus;
  channels: ChannelType[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Alert 도메인 엔티티
 *
 * 알림 이벤트의 원천 데이터를 표현합니다.
 * - 이벤트 발생 시점의 정보 저장
 * - 멱등성 키를 통한 중복 방지
 * - 팬아웃 상태 추적 (PENDING → PROCESSING → COMPLETED/FAILED)
 */
export class Alert<E extends AlertEvent = AlertEvent> {
  private constructor(
    public readonly id: bigint | null,
    public readonly event: E,
    public readonly userId: bigint | null,
    public readonly targetGroup: string | null,
    public readonly payload: AlertPayload<E>,
    public readonly idempotencyKey: string | null,
    private _status: AlertStatus,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _channels: ChannelType[],
  ) { }

  /**
   * 새 Alert 생성
   */
  static create<E extends AlertEvent>(params: CreateAlertParams<E>): Alert<E> {
    const { id, createdAt, event, userId, targetGroup, payload, idempotencyKey, channels } =
      params;

    return new Alert<E>(
      id,
      event,
      userId ?? null,
      targetGroup ?? null,
      payload,
      idempotencyKey ?? null,
      AlertStatus.PENDING,
      createdAt,
      createdAt,
      channels,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   */
  static fromPersistence<E extends AlertEvent>(data: FromPersistenceParams<E>): Alert<E> {
    return new Alert<E>(
      data.id,
      data.event,
      data.userId,
      data.targetGroup,
      data.payload,
      data.idempotencyKey,
      data.status,
      data.createdAt,
      data.updatedAt,
      data.channels,
    );
  }

  // Getters
  get status(): AlertStatus {
    return this._status;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get channels(): ChannelType[] {
    return [...this._channels];
  }

  // 상태 확인 메서드
  isPending(): boolean {
    return this._status === AlertStatus.PENDING;
  }

  isProcessing(): boolean {
    return this._status === AlertStatus.PROCESSING;
  }

  isCompleted(): boolean {
    return this._status === AlertStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this._status === AlertStatus.FAILED;
  }

  /**
   * 처리 시작 상태로 변경
   */
  startProcessing(): void {
    if (this._status !== AlertStatus.PENDING) {
      throw new InvalidAlertStatusTransitionException(
        this._status,
        AlertStatus.PROCESSING,
      );
    }
    this._status = AlertStatus.PROCESSING;
    this._updatedAt = new Date();
  }

  /**
   * 처리 완료 상태로 변경
   */
  complete(): void {
    if (this._status !== AlertStatus.PROCESSING) {
      throw new InvalidAlertStatusTransitionException(
        this._status,
        AlertStatus.COMPLETED,
      );
    }
    this._status = AlertStatus.COMPLETED;
    this._updatedAt = new Date();
  }

  /**
   * 처리 실패 상태로 변경
   */
  fail(): void {
    if (
      this._status !== AlertStatus.PENDING &&
      this._status !== AlertStatus.PROCESSING
    ) {
      throw new InvalidAlertStatusTransitionException(
        this._status,
        AlertStatus.FAILED,
      );
    }
    this._status = AlertStatus.FAILED;
    this._updatedAt = new Date();
  }

  /**
   * 개인 알림인지 확인
   */
  isIndividual(): boolean {
    return this.userId !== null;
  }

  /**
   * 그룹 알림인지 확인
   */
  isGrouped(): boolean {
    return this.targetGroup !== null;
  }
}
