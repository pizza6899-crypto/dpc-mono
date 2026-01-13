// apps/api/src/modules/notification/alert/controllers/admin/alert-admin.controller.ts

import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateAlertService } from '../../application/create-alert.service';
import { FindAlertsService } from '../../application/find-alerts.service';
import { CreateAlertRequestDto } from './dto/request/create-alert.request.dto';
import { FindAlertsQueryDto } from './dto/request/find-alerts-query.dto';
import { AlertResponseDto, AlertListResponseDto } from './dto/response/alert.response.dto';

@ApiTags('Notification Admin')
@Controller('admin/notifications/alerts')
export class AlertAdminController {
    constructor(
        private readonly createAlertService: CreateAlertService,
        private readonly findAlertsService: FindAlertsService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new alert' })
    async createAlert(
        @Body() dto: CreateAlertRequestDto,
    ): Promise<AlertResponseDto> {
        const alert = await this.createAlertService.execute({
            event: dto.event,
            userId: dto.userId ? BigInt(dto.userId) : undefined,
            targetGroup: dto.targetGroup,
            payload: dto.payload,
            channels: dto.channels,
            idempotencyKey: dto.idempotencyKey,
        });

        return AlertResponseDto.fromEntity(alert);
    }

    @Get()
    @ApiOperation({ summary: 'List alerts with filters' })
    async listAlerts(
        @Query() query: FindAlertsQueryDto,
    ): Promise<AlertListResponseDto> {
        const { items, total } = await this.findAlertsService.execute({
            status: query.status,
            event: query.event,
            userId: query.userId ? BigInt(query.userId) : undefined,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            skip: query.skip,
            take: query.take,
        });

        return AlertListResponseDto.fromEntities(items, total);
    }
}
