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
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { PaginatedResponseDto } from 'src/common/http/types/pagination.types';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { SendAlertService } from '../../application/send-alert.service';
import { FindAlertsService } from '../../application/find-alerts.service';
import { Alert, AlertException } from '../../domain';
import { CreateAlertRequestDto } from './dto/request/create-alert.request.dto';
import { FindAlertsQueryDto } from './dto/request/find-alerts-query.dto';
import { AlertResponseDto } from './dto/response/alert.response.dto';
import { MessageCode } from '@repo/shared';

@ApiTags('Admin Notification Alert')
@Controller('admin/notifications/alerts')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class AlertAdminController {
  constructor(
    private readonly sendAlertService: SendAlertService,
    private readonly findAlertsService: FindAlertsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'NOTIFICATION',
    action: 'NOTIFICATION_ALERT_ADMIN_CREATE',
    extractMetadata: (_, args, result) => ({
      request: args[0],
      alertId: result?.id,
      userId: result?.userId,
    }),
  })
  @ApiOperation({ summary: 'Create a new alert' })
  @ApiStandardResponse(AlertResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Successfully created alert',
  })
  async createAlert(
    @Body() dto: CreateAlertRequestDto,
  ): Promise<AlertResponseDto> {
    const alert = await this.sendAlertService.execute({
      event: dto.event,
      userId: dto.userId ? this.parseBigIntOrThrow(dto.userId) : undefined,
      targetGroup: dto.targetGroup,
      payload: dto.payload,
      channels: dto.channels,
      idempotencyKey: dto.idempotencyKey,
    });

    return this.toResponseDto(alert);
  }

  @Get()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'NOTIFICATION',
    action: 'NOTIFICATION_ALERT_ADMIN_LIST',
    extractMetadata: (_, args, result) => ({
      query: args[0],
      count: result?.data?.length ?? 0,
      total: result?.pagination?.total ?? 0,
    }),
  })
  @ApiOperation({ summary: 'List alerts with filters' })
  @ApiPaginatedResponse(AlertResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved alerts',
  })
  async listAlerts(
    @Query() query: FindAlertsQueryDto,
  ): Promise<PaginatedResponseDto<AlertResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.findAlertsService.execute({
      status: query.status,
      event: query.event,
      userId: query.userId ? this.parseBigIntOrThrow(query.userId) : undefined,
      startDate: query.startDate
        ? this.parseDateOrThrow(query.startDate)
        : undefined,
      endDate: query.endDate ? this.parseDateOrThrow(query.endDate) : undefined,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: items.map((item) => this.toResponseDto(item)),
      pagination: {
        page,
        limit,
        total,
      },
    } as unknown as PaginatedResponseDto<AlertResponseDto>;
  }

  private toResponseDto(alert: Alert): AlertResponseDto {
    return {
      id: alert.id?.toString() ?? '',
      event: alert.event,
      userId: alert.userId?.toString() ?? null,
      targetGroup: alert.targetGroup,
      payload: alert.payload,
      idempotencyKey: alert.idempotencyKey,
      status: alert.status,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    };
  }

  private parseBigIntOrThrow(value: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new AlertException(
        `Invalid ID format: ${value}`,
        MessageCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private parseDateOrThrow(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new AlertException(
        `Invalid date format: ${dateString}`,
        MessageCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
    return date;
  }
}
