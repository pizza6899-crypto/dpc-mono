import { Controller, Post, Body, Param, Get, Query, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { SendSupportMessageService } from '../../application/send-support-message.service';
import { ListSupportInquiriesService } from '../../application/list-support-inquiries.service';
import { GetChatMessagesService } from '../../../rooms/application/get-chat-messages.service';
import { ListSupportInquiriesAdminRequestDto } from './dto/request/list-support-inquiries-admin.request.dto';
import { SupportInquiryAdminResponseDto } from './dto/response/support-inquiry-admin.response.dto';
import { SendChatMessageUserRequestDto } from '../../../rooms/controllers/user/dto/request/send-chat-message-user.request.dto';
import { SendMessageResponseDto } from '../../../rooms/controllers/user/dto/response/send-message.response.dto';
import { ChatMessageHistoryRequestDto } from '../../../rooms/controllers/user/dto/request/chat-message-history.request.dto';
import { ChatMessageAdminResponseDto } from '../../../rooms/controllers/admin/dto/response/chat-message-admin.response.dto';
import { ChatRoom } from '../../../rooms/domain/chat-room.entity';
import { ReadChatMessagesService } from '../../../rooms/application/read-chat-messages.service';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT, type ChatRoomMemberRepositoryPort } from '../../../rooms/ports/chat-room-member.repository.port';
import { MarkChatReadRequestDto } from '../../../rooms/controllers/user/dto/request/mark-chat-read.request.dto';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@Controller('admin/chat/support')
@ApiTags('Admin Chat Support')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiCookieAuth()
@ApiBearerAuth()
@ApiStandardErrors()
export class SupportAdminController {
    constructor(
        private readonly sendSupportMessageService: SendSupportMessageService,
        private readonly listInquiriesService: ListSupportInquiriesService,
        private readonly getMessagesService: GetChatMessagesService,
        @Inject(CHAT_ROOM_MEMBER_REPOSITORY_PORT)
        private readonly memberRepository: ChatRoomMemberRepositoryPort,
        private readonly readMessagesService: ReadChatMessagesService,
    ) { }

    @Get('rooms')
    @ApiOperation({ summary: 'List Support Inquiries (Admin) / 상담 목록 조회 (관리자)' })
    @ApiStandardResponse(SupportInquiryAdminResponseDto, { isArray: true })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'ADMIN',
        action: 'LIST_SUPPORT_INQUIRIES',
        extractMetadata: (req, args) => ({
            ...args[0],
        }),
    })
    async list(
        @Query() query: ListSupportInquiriesAdminRequestDto,
    ): Promise<SupportInquiryAdminResponseDto[]> {
        const rooms = await this.listInquiriesService.execute({
            status: query.status,
            priority: query.priority,
            category: query.category,
            adminId: query.adminId ? BigInt(query.adminId) : undefined,
        });

        return rooms.map((room) => this.mapToResponse(room));
    }

    private mapToResponse(room: ChatRoom): SupportInquiryAdminResponseDto {
        return {
            id: room.id.toString(),
            isActive: room.isActive,
            metadata: room.metadata,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
            lastMessageAt: room.lastMessageAt,
            supportStatus: room.supportStatus!,
            supportPriority: room.supportPriority!,
            supportCategory: room.supportCategory!,
            supportSubject: room.supportSubject!,
            supportAdminId: room.supportAdminId?.toString() || null,
        };
    }


    @Get('rooms/:roomId/messages')
    @ApiOperation({ summary: 'Get Support Chat History (Admin) / 상담 채팅 내역 조회 (관리자)' })
    @ApiStandardResponse(ChatMessageAdminResponseDto, { isArray: true })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'ADMIN',
        action: 'VIEW_SUPPORT_MESSAGES',
        extractMetadata: (req, args) => ({
            roomId: args[1],
        }),
    })
    async listMessages(
        @CurrentUser() admin: AuthenticatedUser,
        @Param('roomId') roomIdRaw: string,
        @Query() query: ChatMessageHistoryRequestDto,
    ): Promise<ChatMessageAdminResponseDto[]> {
        const roomId = BigInt(roomIdRaw);

        let lastMessageId: bigint | undefined;
        if (query.lastMessageId) {
            lastMessageId = BigInt(query.lastMessageId);
        }

        const messages = await this.getMessagesService.execute({
            roomId,
            limit: query.limit,
            lastMessageId,
        });

        // 상대방(사용자)의 마지막 읽은 메시지 ID 확인 (1:1 상담 기준)
        const members = await this.memberRepository.listByRoomId(roomId);
        const counterpart = members.find((m) => m.userId !== admin.id);

        return messages.map((m) => ({
            id: m.id.toString(),
            roomId: m.roomId.toString(),
            senderId: m.senderId ? m.senderId.toString() : null,
            content: m.content,
            type: m.type,
            metadata: m.metadata,
            createdAt: m.createdAt,
            isRead: counterpart?.lastReadMessageId ? m.id <= counterpart.lastReadMessageId : false,
        }));
    }

    @Post('rooms/:roomId/messages')
    @ApiOperation({ summary: 'Send Support Reply (Admin) / 상담 답장 전송 (관리자)' })
    @ApiStandardResponse(SendMessageResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'ADMIN',
        action: 'SEND_SUPPORT_REPLY',
        extractMetadata: (req, args) => ({
            roomId: args[1],
        }),
    })
    async sendReply(
        @CurrentUser() admin: AuthenticatedUser,
        @Param('roomId') roomIdRaw: string,
        @Body() body: SendChatMessageUserRequestDto,
    ): Promise<SendMessageResponseDto> {
        const roomId = BigInt(roomIdRaw);

        let imageIds: bigint[] | undefined;
        if (body.imageIds && body.imageIds.length > 0) {
            imageIds = body.imageIds.map(id => BigInt(id));
        }

        const message = await this.sendSupportMessageService.execute({
            roomId,
            senderId: admin.id,
            content: body.content,
            isAdmin: true,
            imageIds,
        });

        return {
            id: message.id.toString(),
        };
    }

    @Post('rooms/:roomId/read')
    @ApiOperation({ summary: 'Mark Support Chat Messages as Read (Admin) / 상담 채팅 메시지 읽음 처리 (관리자)' })
    @ApiStandardResponse(Boolean)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'ADMIN',
        action: 'MARK_SUPPORT_READ',
        extractMetadata: (req, args) => ({
            roomId: args[1],
        }),
    })
    async markAsRead(
        @CurrentUser() admin: AuthenticatedUser,
        @Param('roomId') roomIdRaw: string,
        @Body() body: MarkChatReadRequestDto,
    ): Promise<boolean> {
        const roomId = BigInt(roomIdRaw);
        const lastReadMessageId = BigInt(body.lastReadMessageId);

        await this.readMessagesService.execute({
            roomId,
            userId: admin.id,
            lastReadMessageId,
        });

        return true;
    }
}
