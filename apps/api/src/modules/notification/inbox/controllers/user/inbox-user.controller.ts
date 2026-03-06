// apps/api/src/modules/notification/inbox/controllers/user/inbox-user.controller.ts

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { FindNotificationsService } from '../../application/find-notifications.service';
import { GetUnreadCountService } from '../../application/get-unread-count.service';
import { MarkAsReadService } from '../../application/mark-as-read.service';
import { MarkAllAsReadService } from '../../application/mark-all-as-read.service';
import { DeleteNotificationService } from '../../application/delete-notification.service';
import { NotificationLog, InboxException } from '../../domain';
import { FindNotificationsQueryDto } from './dto/request/find-notifications-query.dto';
import { NotificationParamDto } from './dto/request/notification-param.dto';
import {
  NotificationResponseDto,
} from './dto/response/notification.response.dto';
import { NotificationListResponseDto } from './dto/response/notification-list.response.dto';
import { UnreadCountResponseDto } from './dto/response/unread-count.response.dto';
import { MarkAllAsReadResponseDto } from './dto/response/mark-all-as-read.response.dto';

@ApiTags('User Inbox')
@Controller('user/inbox')
@ApiStandardErrors()
export class InboxUserController {
  constructor(
    private readonly findNotificationsService: FindNotificationsService,
    private readonly getUnreadCountService: GetUnreadCountService,
    private readonly markAsReadService: MarkAsReadService,
    private readonly markAllAsReadService: MarkAllAsReadService,
    private readonly deleteNotificationService: DeleteNotificationService,
    private readonly sqidsService: SqidsService,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  @Get()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'NOTIFICATION',
    action: 'NOTIFICATION_INBOX_LIST',
    extractMetadata: (_, args, result) => ({
      query: args[1],
      count: result?.items?.length ?? 0,
    }),
  })
  @ApiOperation({ summary: 'List user notifications / 사용자 알림 목록 조회' })
  @ApiStandardResponse(NotificationListResponseDto)
  async listNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindNotificationsQueryDto,
  ): Promise<NotificationListResponseDto> {
    const notifications = await this.findNotificationsService.execute({
      receiverId: user.id,
      isRead: query.isRead,
      cursor: query.cursor
        ? this.sqidsService.decode(query.cursor, SqidsPrefix.INBOX)
        : undefined,
      limit: query.limit,
    });

    return {
      items: notifications.map((log) => this.toResponseDto(log)),
      nextCursor:
        notifications.length > 0
          ? this.sqidsService.encode(
            notifications[notifications.length - 1].id!,
            SqidsPrefix.INBOX,
          )
          : null,
    };
  }

  @Get('unread-count')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'NOTIFICATION',
    action: 'NOTIFICATION_INBOX_UNREAD_COUNT',
  })
  @ApiOperation({ summary: 'Get unread notification count / 읽지 않은 알림 수 조회' })
  @ApiStandardResponse(UnreadCountResponseDto)
  async getUnreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UnreadCountResponseDto> {
    const count = await this.getUnreadCountService.execute({
      receiverId: user.id,
    });

    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'NOTIFICATION',
    action: 'NOTIFICATION_INBOX_READ',
    extractMetadata: (_, args) => ({
      id: args[1].id,
    }),
  })
  @ApiOperation({ summary: 'Mark notification as read / 알림 읽음 표시' })
  @ApiStandardResponse(Object, { description: 'Notification marked as read / 알림 읽음 처리 완료' })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: NotificationParamDto,
  ): Promise<object> {
    const decodedId = this.sqidsService.decode(params.id, SqidsPrefix.INBOX);
    const { date: createdAt } = this.snowflakeService.parse(decodedId);

    await this.markAsReadService.execute({
      receiverId: user.id,
      notificationId: decodedId,
      notificationCreatedAt: createdAt,
    });

    return {};
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'NOTIFICATION',
    action: 'NOTIFICATION_INBOX_READ_ALL',
    extractMetadata: (_, __, result) => ({
      updatedCount: result?.updatedCount ?? 0,
    }),
  })
  @ApiOperation({ summary: 'Mark all notifications as read / 모든 알림 읽음 표시' })
  @ApiStandardResponse(MarkAllAsReadResponseDto)
  async markAllAsRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MarkAllAsReadResponseDto> {
    const count = await this.markAllAsReadService.execute({
      receiverId: user.id,
    });

    return { updatedCount: count };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'NOTIFICATION',
    action: 'NOTIFICATION_INBOX_DELETE',
    extractMetadata: (_, args) => ({
      id: args[1].id,
    }),
  })
  @ApiOperation({ summary: 'Delete notification / 알림 삭제' })
  @ApiStandardResponse(Object, { description: 'Notification deleted / 알림 삭제 완료' })
  async deleteNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: NotificationParamDto,
  ): Promise<object> {
    const decodedId = this.sqidsService.decode(params.id, SqidsPrefix.INBOX);
    const { date: createdAt } = this.snowflakeService.parse(decodedId);

    await this.deleteNotificationService.execute({
      receiverId: user.id,
      notificationId: decodedId,
      notificationCreatedAt: createdAt,
    });

    return {};
  }

  private toResponseDto(log: NotificationLog): NotificationResponseDto {
    return {
      id: log.id
        ? this.sqidsService.encode(log.id, SqidsPrefix.INBOX)
        : '',
      createdAt: log.createdAt.toISOString(),
      title: log.title,
      body: log.body,
      actionUri: log.actionUri,
      isRead: log.isRead,
      readAt: log.readAt?.toISOString() ?? null,
      metadata: log.metadata,
    };
  }
}
