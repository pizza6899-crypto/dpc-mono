// apps/api/src/modules/notification/alert/infrastructure/alert.mapper.ts

import { Injectable } from '@nestjs/common';
import { Alert } from '../domain';
import { AlertStatus } from '@repo/database';

type PrismaAlert = {
    id: bigint;
    event: string;
    userId: bigint | null;
    targetGroup: string | null;
    payload: unknown;
    idempotencyKey: string | null;
    status: AlertStatus;
    createdAt: Date;
    updatedAt: Date;
};

@Injectable()
export class AlertMapper {
    toDomain(prisma: PrismaAlert): Alert {
        return Alert.fromPersistence({
            id: prisma.id,
            event: prisma.event,
            userId: prisma.userId,
            targetGroup: prisma.targetGroup,
            payload: prisma.payload as Record<string, unknown>,
            idempotencyKey: prisma.idempotencyKey,
            status: prisma.status,
            createdAt: prisma.createdAt,
            updatedAt: prisma.updatedAt,
        });
    }

    toCreateInput(alert: Alert): {
        event: string;
        userId: bigint | null;
        targetGroup: string | null;
        payload: unknown;
        idempotencyKey: string | null;
        status: AlertStatus;
    } {
        return {
            event: alert.event,
            userId: alert.userId,
            targetGroup: alert.targetGroup,
            payload: alert.payload,
            idempotencyKey: alert.idempotencyKey,
            status: alert.status,
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
