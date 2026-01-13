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
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { FindNotificationsService } from '../../application/find-notifications.service';
import { GetUnreadCountService } from '../../application/get-unread-count.service';
import { MarkAsReadService } from '../../application/mark-as-read.service';
import { MarkAllAsReadService } from '../../application/mark-all-as-read.service';
import { DeleteNotificationService } from '../../application/delete-notification.service';
import { FindNotificationsQueryDto } from './dto/request/find-notifications-query.dto';
import {
    NotificationResponseDto,
    NotificationListResponseDto,
    UnreadCountResponseDto,
    MarkAllAsReadResponseDto,
} from './dto/response/notification.response.dto';

@ApiTags('Notification')
@Controller('user/inbox')
export class InboxUserController {
    constructor(
        private readonly findNotificationsService: FindNotificationsService,
        private readonly getUnreadCountService: GetUnreadCountService,
        private readonly markAsReadService: MarkAsReadService,
        private readonly markAllAsReadService: MarkAllAsReadService,
        private readonly deleteNotificationService: DeleteNotificationService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List user notifications' })
    async listNotifications(
        @CurrentUser() user: CurrentUserWithSession,
        @Query() query: FindNotificationsQueryDto,
    ): Promise<NotificationListResponseDto> {
        const notifications = await this.findNotificationsService.execute({
            receiverId: user.id,
            isRead: query.isRead,
            cursor: query.cursor ? BigInt(query.cursor) : undefined,
            limit: query.limit,
        });

        return NotificationListResponseDto.fromEntities(notifications);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    async getUnreadCount(
        @CurrentUser() user: CurrentUserWithSession,
    ): Promise<UnreadCountResponseDto> {
        const count = await this.getUnreadCountService.execute({
            receiverId: user.id,
        });

        return UnreadCountResponseDto.from(count);
    }

    @Patch(':createdAt/:id/read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark notification as read' })
    async markAsRead(
        @CurrentUser() user: CurrentUserWithSession,
        @Param('createdAt') createdAt: string,
        @Param('id') id: string,
    ): Promise<NotificationResponseDto> {
        const notification = await this.markAsReadService.execute({
            receiverId: user.id,
            notificationId: BigInt(id),
            notificationCreatedAt: new Date(createdAt),
        });

        return NotificationResponseDto.fromEntity(notification);
    }

    @Patch('read-all')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark all notifications as read' })
    async markAllAsRead(
        @CurrentUser() user: CurrentUserWithSession,
    ): Promise<MarkAllAsReadResponseDto> {
        const count = await this.markAllAsReadService.execute({
            receiverId: user.id,
        });

        return MarkAllAsReadResponseDto.from(count);
    }

    @Delete(':createdAt/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete notification' })
    async deleteNotification(
        @CurrentUser() user: CurrentUserWithSession,
        @Param('createdAt') createdAt: string,
        @Param('id') id: string,
    ): Promise<NotificationResponseDto> {
        const notification = await this.deleteNotificationService.execute({
            receiverId: user.id,
            notificationId: BigInt(id),
            notificationCreatedAt: new Date(createdAt),
        });

        return NotificationResponseDto.fromEntity(notification);
    }
}
