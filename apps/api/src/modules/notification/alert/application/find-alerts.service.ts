// apps/api/src/modules/notification/alert/application/find-alerts.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { AlertStatus } from 'src/generated/prisma';
import { Alert } from '../domain';
import { ALERT_REPOSITORY } from '../ports';
import type { AlertRepositoryPort } from '../ports';

interface FindAlertsParams {
    status?: AlertStatus;
    event?: string;
    userId?: bigint;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
}

@Injectable()
export class FindAlertsService {
    constructor(
        @Inject(ALERT_REPOSITORY)
        private readonly alertRepository: AlertRepositoryPort,
    ) { }

    async execute(
        params: FindAlertsParams,
    ): Promise<{ items: Alert[]; total: number }> {
        return this.alertRepository.list(params);
    }
}
