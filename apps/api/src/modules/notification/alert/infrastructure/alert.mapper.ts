// apps/api/src/modules/notification/alert/infrastructure/alert.mapper.ts

import { Injectable } from '@nestjs/common';
import { Alert, type AlertEvent } from '../domain';
import { AlertStatus, Prisma, ChannelType } from '@prisma/client';

type PrismaAlert = {
  id: bigint;
  event: string;
  userId: bigint | null;
  targetGroup: string | null;
  payload: unknown;
  idempotencyKey: string | null;
  status: AlertStatus;
  channels: ChannelType[];
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AlertMapper {
  toDomain(prisma: PrismaAlert): Alert {
    return Alert.fromPersistence({
      id: prisma.id,
      event: prisma.event as AlertEvent,
      userId: prisma.userId,
      targetGroup: prisma.targetGroup,
      payload: prisma.payload as any,
      idempotencyKey: prisma.idempotencyKey,
      status: prisma.status,
      channels: prisma.channels,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  toCreateInput(alert: Alert): {
    id: bigint;
    createdAt: Date;
    event: string;
    userId: bigint | null;
    targetGroup: string | null;
    payload: Prisma.InputJsonValue;
    idempotencyKey: string | null;
    status: AlertStatus;
    channels: ChannelType[];
  } {
    return {
      id: alert.id!,
      createdAt: alert.createdAt,
      event: alert.event as string,
      userId: alert.userId,
      targetGroup: alert.targetGroup,
      payload: alert.payload as unknown as Prisma.InputJsonValue,
      idempotencyKey: alert.idempotencyKey,
      status: alert.status,
      channels: alert.channels,
    };
  }

  toUpdateInput(alert: Alert): {
    status: AlertStatus;
  } {
    return {
      status: alert.status,
    };
  }
}
