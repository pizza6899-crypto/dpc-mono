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
import { MessageCode } from '@repo/shared';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { FindNotificationsService } from '../../application/find-notifications.service';
import { GetUnreadCountService } from '../../application/get-unread-count.service';
import { MarkAsReadService } from '../../application/mark-as-read.service';
import { MarkAllAsReadService } from '../../application/mark-all-as-read.service';
import { DeleteNotificationService } from '../../application/delete-notification.service';
import { NotificationLog, InboxException } from '../../domain';
import { FindNotificationsQueryDto } from './dto/request/find-notifications-query.dto';
import {
  NotificationResponseDto,
  NotificationListResponseDto,
  UnreadCountResponseDto,
  MarkAllAsReadResponseDto,
} from './dto/response/notification.response.dto';

@ApiTags('User Notification')
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
  @ApiOperation({ summary: 'List user notifications' })
  @ApiStandardResponse(NotificationListResponseDto)
  async listNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindNotificationsQueryDto,
  ): Promise<NotificationListResponseDto> {
    const notifications = await this.findNotificationsService.execute({
      receiverId: user.id,
      isRead: query.isRead,
      cursor: query.cursor
        ? this.sqidsService.decode(query.cursor, SqidsPrefix.NOTIFICATION)
        : undefined,
      limit: query.limit,
    });

    return {
      items: notifications.map((log) => this.toResponseDto(log)),
      nextCursor:
        notifications.length > 0
          ? this.sqidsService.encode(
            notifications[notifications.length - 1].id!,
            SqidsPrefix.NOTIFICATION,
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
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiStandardResponse(UnreadCountResponseDto)
  async getUnreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UnreadCountResponseDto> {
    const count = await this.getUnreadCountService.execute({
      receiverId: user.id,
    });

    return { count };
  }

  @Patch(':createdAt/:id/read')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'NOTIFICATION',
    action: 'NOTIFICATION_INBOX_READ',
    extractMetadata: (_, args) => ({
      id: args[2],
      createdAt: args[1],
    }),
  })
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiStandardResponse(NotificationResponseDto)
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('createdAt') createdAt: string,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.markAsReadService.execute({
      receiverId: user.id,
      notificationId: this.sqidsService.decode(id, SqidsPrefix.NOTIFICATION),
      notificationCreatedAt: this.parseDateOrThrow(createdAt),
    });

    return this.toResponseDto(notification);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'NOTIFICATION',
    action: 'NOTIFICATION_INBOX_READ_ALL',
  })
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiStandardResponse(MarkAllAsReadResponseDto)
  async markAllAsRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MarkAllAsReadResponseDto> {
    const count = await this.markAllAsReadService.execute({
      receiverId: user.id,
    });

    return { updatedCount: count };
  }

  @Delete(':createdAt/:id')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'NOTIFICATION',
    action: 'NOTIFICATION_INBOX_DELETE',
    extractMetadata: (_, args) => ({
      id: args[2],
      createdAt: args[1],
    }),
  })
  @ApiOperation({ summary: 'Delete notification' })
  @ApiStandardResponse(NotificationResponseDto)
  async deleteNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('createdAt') createdAt: string,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.deleteNotificationService.execute({
      receiverId: user.id,
      notificationId: this.sqidsService.decode(id, SqidsPrefix.NOTIFICATION),
      notificationCreatedAt: this.parseDateOrThrow(createdAt),
    });

    return this.toResponseDto(notification);
  }

  private toResponseDto(log: NotificationLog): NotificationResponseDto {
    return {
      id: log.id
        ? this.sqidsService.encode(log.id, SqidsPrefix.NOTIFICATION)
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

  private parseDateOrThrow(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new InboxException(
        `Invalid date format: ${dateString}`,
        MessageCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
    return date;
  }
}
